package backend.common.security;

import jakarta.annotation.PostConstruct;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    /** HS256 needs a key of at least 256 bits. */
    private static final int MIN_SECRET_BYTES = 32;

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    /**
     * Stops the application at startup if the secret is missing or too short, instead of
     * starting and then failing on the first login.
     */
    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.getBytes().length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "app.jwt.secret (APP_JWT_SECRET) must be at least " + MIN_SECRET_BYTES + " bytes long");
        }
    }

    /**
     * Builds the HMAC-SHA signing key from the configured secret.
     *
     * @return the {@link SecretKey} used to sign and verify JWTs
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Generates a signed JWT access token for the given email with optional custom claims.
     *
     * @param email  the family email (subject)
     * @param claims custom claims (e.g., userId, role)
     * @return a signed JWT string
     */
    public String generateAccessToken(String email, java.util.Map<String, Object> claims) {
        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateAccessToken(String email) {
        return generateAccessToken(email, java.util.Collections.emptyMap());
    }

    /**
     * Extracts all claims from a JWT token.
     */
    public io.jsonwebtoken.Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Validates a JWT token by attempting to parse and verify it.
     * Returns false if the token is expired, malformed, or has an invalid
     * signature.
     *
     * @param token the JWT string to validate
     * @return true if the token is valid, false otherwise
     */
    public boolean isTokenValid(String token) {
        try {
            extractEmail(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}