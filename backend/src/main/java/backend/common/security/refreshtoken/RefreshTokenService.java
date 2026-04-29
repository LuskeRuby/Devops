package backend.common.security.refreshtoken;

import backend.family.Family;
import backend.user.User;
import backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    /**
     * Creates a new refresh token for the given family.
     * Multiple refresh tokens can exist for the same family so each device
     * can maintain an independent login session.
     *
     * @param family the authenticated family to create a refresh token for
     * @return the newly created and persisted {@link RefreshToken}
     */
    @Transactional
    public RefreshToken createRefreshToken(Family family) {
        return createRefreshToken(family, null, null);
    }

    @Transactional
    public RefreshToken createRefreshToken(Family family, Long userId, String role) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(java.util.UUID.randomUUID().toString());
        refreshToken.setFamily(family);
        refreshToken.setUser(user);
        refreshToken.setRole(role);
        refreshToken.setExpiresAt(java.time.Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS));

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Rotates the given refresh token by deleting it and issuing a new one.
     * This implements refresh token rotation — every time a new access token
     * is requested, the refresh token is also replaced. If a stolen refresh
     * token is used after rotation, it will no longer exist in the database
     * and will be rejected.
     *
     * @param token the raw refresh token string sent by the client
     * @return a newly created {@link RefreshToken} for the same family
     * @throws RuntimeException if the token does not exist or has expired
     */
    @Transactional
    public RefreshToken rotateRefreshToken(String token) {
        RefreshToken existing = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (existing.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(existing);
            throw new RuntimeException("Refresh token expired");
        }

        Family family = existing.getFamily();
        User user = existing.getUser();
        String role = existing.getRole();

        refreshTokenRepository.delete(existing);
        return createRefreshToken(family, user.getId(), role);
    }
}