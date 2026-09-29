package com.karimmarket.controllers;

import com.karimmarket.models.Product;
import com.karimmarket.services.ProductService;
import com.karimmarket.services.ProductImageStorageService;
import com.karimmarket.services.AdminTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductImageStorageService imageStorageService;

    @Autowired
    private AdminTokenService adminTokenService;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam(required = false) String categoryId,
                                                        @RequestParam(required = false) String search) {
        if (categoryId != null && !categoryId.isBlank()) {
            return ResponseEntity.ok(productService.getProductsByCategoryId(categoryId));
        }
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(productService.searchProductsByName(search));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                 @RequestBody Product product) {
        if (!adminTokenService.isValid(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Product created = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id,
                                                 @RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                 @RequestBody Product product) {
        if (!adminTokenService.isValid(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(productService.updateProduct(id, product));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id,
                                              @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!adminTokenService.isValid(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Product existing = productService.getProductById(id).orElseThrow(() -> new RuntimeException("Produit non trouvé"));
            productService.deleteProduct(id);
            // Supprime aussi l'image uploadée associée (droits admin complets).
            String managedImage = imageStorageService.managedFilename(existing.getImageUrl());
            if (managedImage != null) {
                try {
                    imageStorageService.delete(managedImage);
                } catch (java.io.IOException ignored) {
                    // Le produit est déjà supprimé : on ne fait pas échouer la
                    // requete si le fichier image est deja absent du disque.
                }
            }
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/images")
    public ResponseEntity<?> uploadProductImage(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                @RequestParam("file") MultipartFile file) {
        if (!adminTokenService.isValid(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            String filename = imageStorageService.store(file);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(java.util.Map.of("imageUrl", "/api/images/products/" + filename));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("message", "Échec de l'enregistrement de l'image."));
        }
    }

    @DeleteMapping("/images/{filename:.+}")
    public ResponseEntity<Void> deleteUploadedImage(@PathVariable String filename,
                                                    @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!adminTokenService.isValid(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            imageStorageService.delete(filename);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
