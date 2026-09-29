<#
  start-all.ps1 - Automatise le demarrage complet de Karim Market.

  Ce script s'occupe de TOUT, sans intervention manuelle :
    1. Verifie / corrige la version Java du pom.xml pour qu'elle corresponde
       au JDK reellement installe sur la machine.
    2. Verifie / corrige le chemin de donnees de MongoDB (C:\data\db), puis
       lance mongod avec le bon dbPath.
    3. Verifie que les dependances npm sont installees.
    4. Compile le backend proprement (mvn clean package).
    5. Demarre le backend et attend que l'API reponde.
    6. Demarre le frontend (npm run dev) et attend que le site reponde.
    7. Verifie que les produits sont bien servis et affiche un diagnostic.

  Usage :  powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
  Options : -SkipMongo, -SkipBackend, -SkipFrontend, -Rebuild
#>

[CmdletBinding()]
param(
    [switch]$SkipMongo,
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'

# ── Chemins ────────────────────────────────────────────────────────────────
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir  = Join-Path $ProjectRoot 'backend'
$FrontendDir = Join-Path $ProjectRoot 'frontend'
$ToolsDir    = Join-Path $PSScriptRoot '.tools'
$LogDir      = Join-Path $PSScriptRoot 'logs'
$MongoData   = 'C:\data\db'

New-Item -ItemType Directory -Force -Path $ToolsDir, $LogDir | Out-Null

# ── Affichage ──────────────────────────────────────────────────────────────
$script:StepNo = 0
function Write-Step($msg) {
    $script:StepNo++
    Write-Host ''
    Write-Host "==> [$script:StepNo] $msg" -ForegroundColor Cyan
}
function Write-Ok($msg)   { Write-Host "    [OK]   $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "    [FAIL] $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "           $msg" -ForegroundColor DarkGray }

function Wait-ForPort([int]$Port, [int]$TimeoutSec = 90) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $c = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($c) { return $true }
        Start-Sleep -Milliseconds 700
    }
    return $false
}

# ══════════════════════════════════════════════════════════════════════════
# ETAPE 1 - Java : aligner le pom.xml sur le JDK installe
# ══════════════════════════════════════════════════════════════════════════
Write-Step 'Verification du JDK et correction du pom.xml'

function Get-JavaVersion([string]$jdkPath) {
    # "java -version" ecrit sur stderr. Avec $ErrorActionPreference='Stop',
    # la redirection 2>&1 leve une NativeCommandError qu'il faut neutraliser
    # le temps de lire la sortie, sinon on perd la version.
    $prev = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $global:ErrorActionPreference = 'Continue'
        $out = & (Join-Path $jdkPath 'bin\java.exe') -version 2>&1
        $line = ($out | ForEach-Object { $_.ToString() }) -join ' '
    } catch {
        return $null
    } finally {
        $ErrorActionPreference = $prev
        $global:ErrorActionPreference = $prev
    }
    $m = [regex]::Match($line, 'version\s+"(\d+)[."]')
    if ($m.Success) { return $m.Groups[1].Value }
    return $null
}

function Get-InstalledJava {
    # Priorite 1 : JAVA_HOME
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
        $v = Get-JavaVersion $env:JAVA_HOME
        if ($v) { return [pscustomobject]@{ Home = $env:JAVA_HOME; Ver = $v } }    }
    # Priorite 2 : JDK installe sous Program Files
    $dirs = @()
    foreach ($base in @("$env:ProgramFiles\Java", "${env:ProgramFiles(x86)}\Java", "$env:ProgramFiles\Eclipse Adoptium", "$env:ProgramFiles\Microsoft")) {
        if (Test-Path $base) { $dirs += Get-ChildItem $base -Directory -ErrorAction SilentlyContinue }
    }
    foreach ($d in $dirs) {
        if (-not (Test-Path (Join-Path $d.FullName 'bin\java.exe'))) { continue }
        $v = Get-JavaVersion $d.FullName
        if ($v) { return [pscustomobject]@{ Home = $d.FullName; Ver = $v } }    }
    return $null
}

$java = Get-InstalledJava
if (-not $java) {
    Write-Fail 'Aucun JDK trouve. Installez un JDK 17 ou superieur.'
    exit 1
}
$javaVer = $java.Ver
Write-Ok "JDK detecte : $javaVer ($($java.Home))"

# Maven exige >= 17 pour Spring Boot 3.5 ; on refuse les versions trop anciennes
if ([int]$javaVer -lt 17) {
    Write-Fail "JDK $javaVer trop ancien. Spring Boot 3.5 requiert JDK 17+."
    exit 1
}

$pom = Join-Path $BackendDir 'pom.xml'
if (Test-Path $pom) {
    $xml = Get-Content $pom -Raw
    $new = [regex]::Replace($xml, '(?m)^(\s*<(?:java\.version|maven\.compiler\.source|maven\.compiler\.target)>)\d+(</)', "`${1}$javaVer`${2}")
    if ($new -ne $xml) {
        Set-Content -Path $pom -Value $new -Encoding UTF8 -NoNewline
        Write-Ok "pom.xml aligne sur Java $javaVer (spring-boot 3.5.0 exigeait 25, incompatible avec votre JDK)"
    } else {
        Write-Ok "pom.xml deja aligne sur Java $javaVer"
    }
} else {
    Write-Fail "pom.xml introuvable : $pom"
    exit 1
}

# ══════════════════════════════════════════════════════════════════════════
# ETAPE 2 - Maven : trouver ou installer
# ══════════════════════════════════════════════════════════════════════════
Write-Step 'Verification de Maven'

$mvnHome = $null
if ($env:MAVEN_HOME -and (Test-Path (Join-Path $env:MAVEN_HOME 'bin\mvn.cmd'))) { $mvnHome = $env:MAVEN_HOME }
if (-not $mvnHome) {
    $cmd = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($cmd) { $mvnHome = Split-Path -Parent (Split-Path -Parent $cmd.Source) }
}
if (-not $mvnHome) {
    $existing = Get-ChildItem $ToolsDir -Directory -Filter 'apache-maven-*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($existing) { $mvnHome = $existing.FullName }
}
if (-not $mvnHome) {
    Write-Warn2 'Maven absent - telechargement...'
    $zip = Join-Path $ToolsDir 'maven.zip'
    try {
        $page = Invoke-WebRequest 'https://dlcdn.apache.org/maven/maven-3/' -UseBasicParsing -TimeoutSec 30
        $ver = ([regex]::Matches($page.Content, '3\.\d+\.\d+') | ForEach-Object { $_.Value } | Sort-Object -Descending | Select-Object -First 1)
        if (-not $ver) { throw 'Version Maven introuvable' }
        $url = "https://dlcdn.apache.org/maven/maven-3/$ver/binaries/apache-maven-$ver-bin.zip"
        Write-Info "Telechargement $url"
        Invoke-WebRequest $url -OutFile $zip -UseBasicParsing -TimeoutSec 300
        Expand-Archive -Path $zip -DestinationPath $ToolsDir -Force
        Remove-Item $zip -Force
        $mvnHome = (Get-ChildItem $ToolsDir -Directory -Filter 'apache-maven-*' | Select-Object -First 1).FullName
        Write-Ok "Maven $ver installe dans le projet"
    } catch {
        Write-Fail "Installation Maven impossible : $($_.Exception.Message)"
        exit 1
    }
}
$MvnCmd = Join-Path $mvnHome 'bin\mvn.cmd'
Write-Ok "Maven : $MvnCmd"

# ══════════════════════════════════════════════════════════════════════════
# ETAPE 3 - MongoDB : dbPath accessible + lancement
# ══════════════════════════════════════════════════════════════════════════
if ($SkipMongo) {
    Write-Step 'MongoDB ignore (-SkipMongo)'
} else {
    Write-Step 'Verification et lancement de MongoDB'

    $mongoBin = $null
    foreach ($p in @(
        'C:\Program Files\MongoDB\Server',
        'C:\Program Files\MongoDB',
        'C:\mongodb',
        "${env:ProgramFiles}\MongoDB\Server")) {
        if (Test-Path $p) {
            $f = Get-ChildItem $p -Recurse -Filter 'mongod.exe' -ErrorAction SilentlyContinue |
                 Sort-Object FullName -Descending | Select-Object -First 1
            if ($f) { $mongoBin = $f.FullName; break }
        }
    }

    if (-not $mongoBin) {
        Write-Fail 'mongod.exe introuvable. Installez MongoDB Community Server.'
        exit 1
    }
    Write-Ok "mongod : $mongoBin"

    # 3a. Lire le dbPath configure pour le service.
    # Un dbPath sous "C:\Program Files" provoque un crash WiredTiger
    # ("CreateFileW: Acces refuse") car le dossier est protege par Windows.
    $svcCfg = Get-ChildItem (Split-Path $mongoBin) -Filter 'mongod.cfg' -ErrorAction SilentlyContinue | Select-Object -First 1
    $cfg = $null
    $oldData = $null
    $cfgFixed = $false
    if ($svcCfg) {
        $cfg = Get-Content $svcCfg.FullName -Raw
        if ($cfg -match '(?m)^\s*dbPath:\s*(.+?)\s*$') { $oldData = $Matches[1].Trim() }
        if ($oldData -and $oldData -like '*Program Files*') {
            Write-Warn2 "dbPath du service dans un dossier protege : $oldData"
        }
    }

    # 3b. Migrer les donnees vers C:\data\db si elles sont dans Program Files.
    #     WiredTiger refuse d'ecrire la bas, mongod crashait au demarrage.
    if ($oldData -and $oldData -ne $MongoData -and (Test-Path (Join-Path $oldData 'WiredTiger.turtle'))) {
        Write-Info "Migration des donnees : $oldData -> $MongoData"
        # On PURGE la cible avant de copier. Sans cela, les journaux
        # WiredTiger de l'ancien emplacement se melangent a ceux deja
        # presents et mongod echoue au demarrage avec
        # "WiredTiger metadata corruption detected".
        Get-Process mongod -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        if (Test-Path $MongoData) {
            Remove-Item -Path (Join-Path $MongoData '*') -Recurse -Force -ErrorAction SilentlyContinue
        }
        New-Item -ItemType Directory -Force -Path $MongoData | Out-Null
        try {
            Copy-Item -Path (Join-Path $oldData '*') -Destination $MongoData -Recurse -Force -ErrorAction Stop
            Write-Ok 'Donnees migrees (aucune perte)'
        } catch {
            Write-Fail "Migration echouee : $($_.Exception.Message)"
            Write-Info 'Relancez le script en administrateur, ou copiez le dossier manuellement.'
            exit 1
        }
        # Corriger mongod.cfg pour que le service Windows soit lui aussi fonctionnel
        try {
            $newCfg = $cfg -replace '(?m)^(\s*dbPath:\s*).+$', "`${1}$MongoData"
            Set-Content -Path $svcCfg.FullName -Value $newCfg -Encoding UTF8
            $cfgFixed = $true
            Write-Ok "mongod.cfg mis a jour -> $MongoData"
        } catch {
            Write-Warn2 'mongod.cfg non modifie (relancez en administrateur) - lancement direct utilise'
        }
    }

    if (-not (Test-Path $MongoData)) { New-Item -ItemType Directory -Force -Path $MongoData | Out-Null }
    Write-Ok "dbPath utilise : $MongoData"

    # 3c. Arret d'une instance deja lancee (possiblement sur le mauvais dbPath)
    Get-Process mongod -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    # 3d. Lancer mongod : service Windows si fiable, sinon process direct.
    $useService = ($cfgFixed -or ($oldData -eq $MongoData))
    $started = $false
    $svc = Get-Service -Name 'MongoDB' -ErrorAction SilentlyContinue
    if ($svc -and $useService) {
        try {
            Set-Service -Name 'MongoDB' -StartupType Automatic -ErrorAction Stop
            Start-Service -Name 'MongoDB' -ErrorAction Stop
            $started = $true
            Write-Ok 'Service MongoDB demarre (demarrage automatique configure)'
        } catch {
            Write-Warn2 "Service non demarrable ($($_.Exception.Message)) - lancement direct"
        }
    }
    if (-not $started) {
        $log = Join-Path $MongoData 'mongod.log'
        Start-Process -FilePath $mongoBin `
            -ArgumentList @('--dbpath', $MongoData, '--port', '27017', '--bind_ip', '127.0.0.1', '--logpath', $log) `
            -WindowStyle Hidden | Out-Null
        Write-Ok 'mongod lance sur C:\data\db (port 27017)'
    }

    if (Wait-ForPort 27017 60) {
        Write-Ok 'MongoDB ecoute sur le port 27017'
    } else {
        Write-Fail 'MongoDB ne demarre pas. Verifiez le log.'
        if (Test-Path (Join-Path $MongoData 'mongod.log')) { Get-Content (Join-Path $MongoData 'mongod.log') -Tail 15 | ForEach-Object { Write-Info $_ } }
        exit 1
    }
}

# ══════════════════════════════════════════════════════════════════════════
# ETAPE 4 - Dependances frontend
# ══════════════════════════════════════════════════════════════════════════
Write-Step 'Verification des dependances frontend'

$nodeExe = $null
foreach ($c in @('C:\Program Files\nodejs\node.exe', "${env:ProgramFiles(x86)}\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")) {
    if (Test-Path $c) { $nodeExe = $c; break }
}
if (-not $nodeExe) { $cmd = Get-Command node -ErrorAction SilentlyContinue; if ($cmd) { $nodeExe = $cmd.Source } }
if (-not $nodeExe) { Write-Fail 'Node.js introuvable. Installez Node.js 18+.'; exit 1 }
$env:Path = (Split-Path $nodeExe) + ';' + $env:Path
Write-Ok "Node : $nodeExe"

if (-not (Test-Path (Join-Path $FrontendDir 'node_modules'))) {
    Write-Info 'Installation des dependances npm...'
    Push-Location $FrontendDir
    try { & (Join-Path (Split-Path $nodeExe) 'npm.cmd') install --no-audit --no-fund } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Write-Fail 'npm install a echoue'; exit 1 }
}
Write-Ok 'node_modules present'

# ══════════════════════════════════════════════════════════════════════════
# ETAPE 5 - Compilation du backend
# ══════════════════════════════════════════════════════════════════════════
$JarPath = Join-Path $BackendDir 'target\karim-market-backend-1.0.0.jar'
if ($SkipBackend) {
    Write-Step 'Backend ignore (-SkipBackend)'
} else {
    Write-Step 'Compilation du backend (mvn clean package)'

    # Arret d'un backend deja en ecoute pour liberer le port et le JAR
    Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2

    if (-not $Rebuild -and (Test-Path $JarPath) -and (Get-Item $JarPath).LastWriteTime -gt (Get-Item (Join-Path $BackendDir 'src\main\java\com\karimmarket\config\DataSeeder.java')).LastWriteTime) {
        Write-Warn2 'JAR plus recent que les sources : compilation sautee (-Rebuild pour forcer)'
    } else {
        $env:JAVA_HOME = $java.Home
        Push-Location $BackendDir
        try {
            & $MvnCmd -B -q clean package '-DskipTests' 2>&1 | ForEach-Object {
                if ($_ -match 'ERROR|BUILD') { Write-Info $_ }
            }
            if ($LASTEXITCODE -ne 0) {
                Write-Fail 'La compilation Maven a echoue. Erreurs ci-dessus :'
                Push-Location $BackendDir
                & $MvnCmd -B clean package '-DskipTests' 2>&1 | Select-String 'ERROR' | Select-Object -First 15 | ForEach-Object { Write-Info $_ }
                Pop-Location
                exit 1
            }
        } finally { Pop-Location }
        Write-Ok 'Compilation reussie'
    }

    if (-not (Test-Path $JarPath)) { Write-Fail "JAR introuvable : $JarPath"; exit 1 }
    $jarDate = (Get-Item $JarPath).LastWriteTime
    Write-Ok "JAR : $(Split-Path $JarPath -Leaf) ($($jarDate.ToString('dd/MM HH:mm')))"

    # ══════════════════════════════════════════════════════════════════════
    # ETAPE 6 - Demarrage du backend
    # ══════════════════════════════════════════════════════════════════════
    Write-Step 'Demarrage du backend'
    $env:JAVA_HOME = $java.Home
    $outLog = Join-Path $LogDir 'backend.out.log'
    $errLog = Join-Path $LogDir 'backend.err.log'
    # Le chemin du projet contient un espace ("Charaf Makroum") : on passe
    # l'argument -jar entre guillemets, sinon java tronque le chemin.
    $jarArg = '"' + $JarPath + '"'
    Start-Process -FilePath (Join-Path $java.Home 'bin\java.exe') `
        -ArgumentList @('-jar', $jarArg) `
        -WorkingDirectory $BackendDir `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog `
        -WindowStyle Hidden | Out-Null
    Write-Ok 'Backend lance (attente de l API)...'

    if (Wait-ForPort 8080 120) {
        Write-Ok 'Backend en ecoute sur http://localhost:8080'
    } else {
        Write-Fail 'Le backend n a pas demarre. Extrait du log :'
        if (Test-Path $outLog) { Get-Content $outLog -Tail 25 | ForEach-Object { Write-Info $_ } }
        if (Test-Path $errLog) { Get-Content $errLog -Tail 15 | ForEach-Object { Write-Info $_ } }
        exit 1
    }
}

# ══════════════════════════════════════════════════════════════════════════
# ETAPE 7 - Demarrage du frontend
# ══════════════════════════════════════════════════════════════════════════
if ($SkipFrontend) {
    Write-Step 'Frontend ignore (-SkipFrontend)'
} else {
    Write-Step 'Demarrage du frontend (npm run dev)'
    $feLog = Join-Path $LogDir 'frontend.log'
    Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1

    # On passe par un .bat dedie : la redirection ">" via Start-Process/cmd
    # echoue silencieusement des que le chemin contient un espace.
    $runner = Join-Path $LogDir 'run-frontend.bat'
    $nodeDir = Split-Path $nodeExe
    $bat = @(
        '@echo off'
        "set PATH=$nodeDir;%PATH%"
        "cd /d `"$FrontendDir`""
        "npm.cmd run dev > `"$feLog`" 2>&1"
    ) -join "`r`n"
    Set-Content -Path $runner -Value $bat -Encoding ASCII

    Start-Process -FilePath $runner -WorkingDirectory $FrontendDir -WindowStyle Hidden | Out-Null
    Write-Ok 'Frontend lance (port 5173)'

    if (Wait-ForPort 5173 90) { Write-Ok 'Frontend en ecoute sur http://localhost:5173' }
    else { Write-Warn2 'Le frontend ne repond pas encore. Verifiez scripts/logs/frontend.log' }
}

# ══════════════════════════════════════════════════════════════════════════
# ETAPE 8 - Verification des produits
# ══════════════════════════════════════════════════════════════════════════
Write-Step 'Verification du catalogue'

try {
    $cat = Invoke-RestMethod 'http://localhost:8080/api/categories' -TimeoutSec 20
    $prods = Invoke-RestMethod 'http://localhost:8080/api/products' -TimeoutSec 30
    Write-Ok "Categories : $($cat.Count)"
    Write-Ok "Produits servis par l API : $($prods.Count)"

    if ($prods.Count -gt 0) {
        Write-Host ''
        Write-Host '    Apercu :' -ForegroundColor Cyan
        $prods | Select-Object -First 5 | ForEach-Object {
            Write-Info ("      {0} - {1} DH" -f $_.name, $_.price)
        }
    }

    # Le seed doit avoir au moins 200 produits du catalogue par defaut
    if ($prods.Count -lt 200) {
        Write-Warn2 "Seulement $($prods.Count) produits : le catalogue par defaut (343) n est pas complet."
        Write-Info 'Verifiez que le JAR contient bien le DataSeeder corrige.'
        $seed = Select-String -Path (Join-Path $LogDir 'backend.out.log') -Pattern 'Catalogue verifie' -ErrorAction SilentlyContinue | Select-Object -Last 1
        if ($seed) { Write-Info $seed.Line }
    } else {
        Write-Ok 'Catalogue complet : produits par defaut + ajouts admin presents'
    }
} catch {
    Write-Fail "Verification impossible : $($_.Exception.Message)"
    exit 1
}

# ══════════════════════════════════════════════════════════════════════════
Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host '  KARIM MARKET EST DEMARRE' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host "  Site    : http://localhost:5173"
Write-Host "  Admin   : http://localhost:5173/admin/login"
Write-Host "  API     : http://localhost:8080/api/products"
Write-Host "  Logs    : $LogDir"
Write-Host ''
Write-Host '  Arret : Ctrl+C, ou scripts\stop-all.ps1'
Write-Host '============================================================'
