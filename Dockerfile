# syntax=docker/dockerfile:1
# ============================================================
#  Karim Market — Image unique React + Spring Boot + MongoDB
#  Un seul conteneur, un seul lien web (port $PORT fourni par
#  l'hebergeur, ex. Render). Spring Boot sert l'interface React
#  compilee (static/) et l'API /api sur le meme port.
# ============================================================

# ---------- Etape 1 : compilation du frontend React (Vite) ----------
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build
# Resultat : /build/dist (index.html, assets/, images/)

# ---------- Etape 2 : compilation du backend Spring Boot ----------
# JDK 23 (exige par pom.xml) + le Maven deja present dans le projet
FROM eclipse-temurin:23-jdk-noble AS backend-build
ENV MAVEN_HOME=/opt/maven
ENV PATH="${MAVEN_HOME}/bin:${PATH}"
COPY scripts/.tools/apache-maven-3.9.16 /opt/maven
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
# Injection du build React dans le JAR : Spring Boot servira
# l'interface sur / (fusionne avec static/assets/img/products existant)
COPY --from=frontend-build /build/dist ./src/main/resources/static/
RUN mvn -B -q clean package -DskipTests
# Resultat : /build/target/karim-market-backend-1.0.0.jar

# ---------- Etape 3 : image finale (JRE 23 + MongoDB) ----------
FROM eclipse-temurin:23-jre-noble

# MongoDB Community Server 8.0 (demarre en local dans le conteneur ;
# automatiquement ignore si SPRING_DATA_MONGODB_URI pointe ailleurs,
# ex. MongoDB Atlas gratuit pour des donnees persistantes)
RUN apt-get update \
 && apt-get install -y --no-install-recommends gnupg curl ca-certificates \
 && curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
      | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg \
 && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-8.0.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends mongodb-org-server mongodb-org-mongos \
 && apt-get purge -y --auto-remove gnupg curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend-build /build/target/karim-market-backend-1.0.0.jar app.jar
COPY docker-entrypoint.sh /entrypoint.sh
# sed : neutralise d'eventuels retours chariot Windows (CRLF)
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh \
 && mkdir -p /data/db /app/uploads/products

# Memoire bornee pour les petits hebergements gratuits (512 Mo)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=50"
# Uploads d'images admin dans un chemin explicite du conteneur
ENV APP_UPLOADS_PRODUCTS_DIR=/app/uploads/products

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
