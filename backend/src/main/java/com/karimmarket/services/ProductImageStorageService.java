package com.karimmarket.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class ProductImageStorageService {
    private static final long MAX_SIZE = 5L * 1024 * 1024;

    @Value("${app.uploads.products-dir:uploads/products}")
    private String productsDirectory;

    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty() || file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("L'image doit peser au maximum 5 Mo.");
        }

        byte[] bytes = file.getBytes();
        String extension = detectExtension(bytes);
        if (extension == null) {
            throw new IllegalArgumentException("Format d'image non pris en charge. Utilisez JPEG, PNG, GIF ou WebP.");
        }

        Path directory = Paths.get(productsDirectory).toAbsolutePath().normalize();
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + extension;
        Files.write(directory.resolve(filename), bytes);
        return filename;
    }

    public Path resolve(String filename) {
        if (filename == null || !filename.matches("[a-f0-9-]+\\.(jpg|png|gif|webp)")) {
            throw new IllegalArgumentException("Nom d'image invalide.");
        }
        Path directory = Paths.get(productsDirectory).toAbsolutePath().normalize();
        Path image = directory.resolve(filename).normalize();
        if (!image.getParent().equals(directory)) {
            throw new IllegalArgumentException("Chemin d'image invalide.");
        }
        return image;
    }

    public void delete(String filename) throws IOException {
        Files.deleteIfExists(resolve(filename));
    }

    public String managedFilename(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/api/images/products/")) return null;
        String filename = imageUrl.substring("/api/images/products/".length());
        try {
            resolve(filename);
            return filename;
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private String detectExtension(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return ".jpg";
        if (bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') return ".png";
        if (bytes.length >= 6 && new String(bytes, 0, 3).equals("GIF")) return ".gif";
        if (bytes.length >= 12 && new String(bytes, 0, 4).equals("RIFF") && new String(bytes, 8, 4).equals("WEBP")) return ".webp";
        return null;
    }
}
