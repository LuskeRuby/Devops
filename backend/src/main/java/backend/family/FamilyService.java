package backend.family;

import backend.common.exception.EmailAlreadyInUseException;
import backend.common.exception.InvalidCredentialsException;
import backend.common.security.JwtUtil;
import backend.common.security.refreshtoken.RefreshToken;
import backend.common.security.refreshtoken.RefreshTokenService;
import backend.family.dto.FamilyAuthResponseDto;
import backend.family.dto.FamilyLoginDto;
import backend.family.dto.FamilyRequestDto;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FamilyService {

    @Value("${app.jwt.refresh-token-cookie.secure:false}")
    private boolean refreshTokenCookieSecure;

    @Value("${app.jwt.refresh-token-cookie.same-site:Lax}")
    private String refreshTokenCookieSameSite;

    @Value("${app.jwt.refresh-token-cookie.max-age-seconds:86400}")
    private long refreshTokenCookieMaxAgeSeconds;

    private final FamilyRepository familyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    /**
     * Registers a new family account.
     * Checks for duplicate emails before saving.
     * The password is hashed using BCrypt before persistence —
     * the plain text password is never stored.
     *
     * @param dto the registration payload containing the family's email and
     *            password
     * @throws EmailAlreadyInUseException if the email is already registered
     */
    public void register(FamilyRequestDto dto) {
        if (familyRepository.existsById(dto.email())) {
            throw new EmailAlreadyInUseException(dto.email());
        }

        Family family = new Family();
        family.setEmail(dto.email());
        family.setPassword(passwordEncoder.encode(dto.password()));
        familyRepository.save(family);
    }

    /**
     * Authenticates a family using email and password.
     * On success, generates a short-lived access token (1 minute) returned in the
     * response body, and a refresh token stored in an HttpOnly cookie.
     *
     * @param dto      the login payload containing email and password
     * @param response the HTTP response used to attach the refresh token cookie
     * @return a {@link FamilyAuthResponseDto} containing the access token
     * @throws RuntimeException if the email is not found or the password does not
     *                          match
     */
    public FamilyAuthResponseDto login(FamilyLoginDto dto, HttpServletResponse response) {
        Family family = familyRepository.findById(dto.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(dto.password(), family.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String accessToken = jwtUtil.generateAccessToken(family.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(family);
        setRefreshTokenCookie(response, refreshToken.getToken());

        return new FamilyAuthResponseDto(accessToken, family.getEmail());
    }

    /**
     * Issues a new access token using a valid refresh token.
     * The refresh token is rotated on every call — the old token is deleted
     * and a new one is issued. This means a stolen refresh token can only be
     * used once before it is invalidated.
     *
     * @param refreshToken the refresh token string read from the HttpOnly cookie
     * @param response     the HTTP response used to set the new rotated refresh
     *                     token cookie
     * @return a {@link FamilyAuthResponseDto} containing the new access token
     * @throws RuntimeException if the refresh token is invalid or expired
     */
    public FamilyAuthResponseDto refresh(String refreshToken, HttpServletResponse response) {
        RefreshToken rotated = refreshTokenService.rotateRefreshToken(refreshToken);
        
        Map<String, Object> claims = new HashMap<>();
        if (rotated.getUser() != null) {
            claims.put("userId", rotated.getUser().getId());
        }
        if (rotated.getRole() != null) {
            claims.put("role", rotated.getRole());
        }

        String accessToken = jwtUtil.generateAccessToken(rotated.getFamily().getEmail(), claims);
        setRefreshTokenCookie(response, rotated.getToken());
        return new FamilyAuthResponseDto(accessToken, rotated.getFamily().getEmail());
    }

    /**
     * Attaches the refresh token as an HttpOnly cookie to the HTTP response.
     * HttpOnly prevents JavaScript from reading the cookie, protecting against XSS
     * attacks.
     * The cookie is scoped to the /api/families/refresh path so it is only sent
     * when the client explicitly requests a token refresh.
     *
     * @param response the HTTP response to attach the cookie to
     * @param token    the raw refresh token string to store in the cookie
     */
    public void setRefreshTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(refreshTokenCookieSecure)
                .path("/api/families/refresh")
                .maxAge(refreshTokenCookieMaxAgeSeconds)
                .sameSite(refreshTokenCookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}