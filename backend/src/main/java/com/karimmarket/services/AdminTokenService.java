package com.karimmarket.services;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class AdminTokenService {
    private static final long SESSION_HOURS = 8;
    private final ConcurrentMap<String, Instant> tokens = new ConcurrentHashMap<>();

    public String issueToken() {
        String token = UUID.randomUUID() + UUID.randomUUID().toString().replace("-", "");
        tokens.put(token, Instant.now().plusSeconds(SESSION_HOURS * 60 * 60));
        return token;
    }

    public boolean isValid(String token) {
        if (token == null) return false;
        Instant expiresAt = tokens.get(token);
        if (expiresAt == null) return false;
        if (Instant.now().isAfter(expiresAt)) {
            tokens.remove(token);
            return false;
        }
        return true;
    }

    public void revoke(String token) {
        if (token != null) tokens.remove(token);
    }
}
