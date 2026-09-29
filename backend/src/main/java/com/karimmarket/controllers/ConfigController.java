package com.karimmarket.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.karimmarket.services.AdminTokenService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {
    @Autowired
    private AdminTokenService adminTokenService;

    @Value("${app.whatsapp.number:0604527252}")
    private String whatsappNumber;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.orders.minimum-amount:50.0}")
    private Double minimumOrderAmount;

    @Value("${app.images.default-product:/api/images/product-default}")
    private String defaultProductImage;

    @GetMapping("/whatsapp")
    public ResponseEntity<Map<String, Object>> getWhatsappConfig() {
        Map<String, Object> response = new HashMap<>();
        response.put("number", whatsappNumber);
        response.put("minimumOrderAmount", minimumOrderAmount);
        response.put("defaultProductImage", defaultProductImage);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPublicConfig() {
        Map<String, Object> response = new HashMap<>();
        response.put("whatsappNumber", whatsappNumber);
        response.put("minimumOrderAmount", minimumOrderAmount);
        response.put("defaultProductImage", defaultProductImage);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/login")
    public ResponseEntity<Map<String, Object>> adminLogin(@RequestBody Map<String, String> body) {
        String password = body.get("password");
        Map<String, Object> response = new HashMap<>();
        if (!adminPassword.isBlank() && adminPassword.equals(password)) {
            response.put("success", true);
            response.put("message", "Authentification réussie");
            response.put("token", adminTokenService.issueToken());
        } else {
            response.put("success", false);
            response.put("message", "Mot de passe incorrect");
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/logout")
    public ResponseEntity<Void> adminLogout(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        adminTokenService.revoke(token);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/session")
    public ResponseEntity<Void> validateAdminSession(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        return adminTokenService.isValid(token)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
