package com.beverages.ecommerce.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMs; // 86400000 (24 hours)

    @Value("${jwt.remember-me-expiration}")
    private long rememberMeExpirationInMs; // 604800000 (7 days)

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        return generateToken(authentication, jwtExpirationInMs);
    }

    public String generateToken(Authentication authentication, long expirationInMs) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationInMs);

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .claim("userId", userDetails.getId())
                .claim("role", userDetails.getUser().getRole())
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        // Let JWT exceptions bubble up to the filter so we can catch specific cases (expired/invalid)
        Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
        return true;
    }

    public long getRememberMeExpirationInMs() {
        return rememberMeExpirationInMs;
    }
}
