package com.karimmarket.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.karimmarket.services.ProductImageStorageService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    @Value("${app.uploads.products-dir:uploads/products}")
    private String productsDir;

    private final ProductImageStorageService imageStorageService;

    public ImageController(ProductImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    private static final String DEFAULT_IMAGE = "placeholder-product.svg";

    // IDs de catégories valides (1–9)
    private static final Set<String> VALID_CATEGORY_IDS =
        Set.of("1","2","3","4","5","6","7","8","9");

    // ── Endpoint principal : image d'un produit ───────────────────────────────
    // GET /api/images/products/{imageName}
    // Si le fichier existe → sert l'image.
    // Sinon → répond 404 (le frontend gère le fallback catégorie lui-même).
    @GetMapping("/products/{imageName}")
    public ResponseEntity<Resource> getProductImage(@PathVariable String imageName) {
        try {
            Path imagePath = imageStorageService.resolve(imageName);
            if (Files.exists(imagePath)) {
                Resource resource = new FileSystemResource(imagePath.toFile());
                String contentType = Files.probeContentType(imagePath);
                return ResponseEntity.ok()
                        // Cache court (5 min) — assez pour les perfs, assez court
                        // pour que les nouvelles images apparaissent sans redémarrage
                        .header("Cache-Control", "public, max-age=300")
                        .contentType(MediaType.parseMediaType(
                            contentType != null ? contentType : "application/octet-stream"))
                        .body(resource);
            }
        } catch (Exception e) {
            System.err.println("Erreur chargement image: " + e.getMessage());
        }
        // 404 avec no-store → le navigateur retentera à chaque fois
        return ResponseEntity.notFound()
                .header("Cache-Control", "no-store")
                .build();
    }

    // ── Fallback intelligent par catégorie ────────────────────────────────────
    // GET /api/images/product-fallback/{categoryId}
    // Sert le SVG de la catégorie correspondante (fallback-cat-{id}.svg).
    // Si categoryId inconnu → sert le placeholder générique.
    @GetMapping("/product-fallback/{categoryId}")
    public ResponseEntity<Resource> getCategoryFallback(@PathVariable String categoryId) {
        if (VALID_CATEGORY_IDS.contains(categoryId)) {
            try {
                String filename = "fallback-cat-" + categoryId + ".svg";
                Path svgPath = Paths.get(productsDir).resolve(filename);
                if (Files.exists(svgPath)) {
                    Resource resource = new FileSystemResource(svgPath.toFile());
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType("image/svg+xml"))
                            // Cache 24h — ces fichiers ne changent jamais
                            .header("Cache-Control", "public, max-age=86400")
                            .body(resource);
                }
                // Fallback depuis classpath (en cas de déploiement JAR)
                ClassPathResource cp = new ClassPathResource(
                    "static/assets/img/products/" + filename);
                if (cp.exists()) {
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType("image/svg+xml"))
                            .header("Cache-Control", "public, max-age=86400")
                            .body(cp);
                }
            } catch (Exception e) {
                System.err.println("Erreur fallback catégorie " + categoryId + ": " + e.getMessage());
            }
        }
        // Dernier recours : placeholder générique
        return getDefaultImage();
    }

    // ── Placeholder générique (inchangé) ─────────────────────────────────────
    @GetMapping("/product-default")
    public ResponseEntity<Resource> getDefaultImage() {
        try {
            Resource defaultResource = new ClassPathResource(
                "static/assets/img/products/" + DEFAULT_IMAGE);
            if (defaultResource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("image/svg+xml"))
                        .body(defaultResource);
            }
        } catch (Exception e) {
            System.err.println("Erreur image par défaut: " + e.getMessage());
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/svg+xml"))
                .body(new ByteArrayResource(getFallbackSvgBytes()));
    }

    private byte[] getFallbackSvgBytes() {
        String svg = """
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
              <rect width="200" height="200" fill="#f3f4f6" rx="12"/>
              <g fill="#9ca3af">
                <rect x="40" y="60" width="120" height="90" rx="8" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
                <circle cx="80" cy="90" r="10" fill="#9ca3af"/>
                <polygon points="50,150 90,110 110,130 140,90 150,150" fill="#9ca3af"/>
                <rect x="60" y="40" width="80" height="18" rx="4" fill="#f97316" opacity="0.8"/>
                <text x="100" y="53" font-family="Arial" font-size="11" text-anchor="middle" fill="white">Produit</text>
              </g>
            </svg>
            """;
        return svg.getBytes();
    }
}
