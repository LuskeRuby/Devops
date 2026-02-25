package backend.family;

import backend.common.security.JwtUtil;
import backend.common.security.refreshtoken.RefreshToken;
import backend.common.security.refreshtoken.RefreshTokenService;
import backend.family.dto.FamilyAuthResponseDto;
import backend.family.dto.FamilyLoginDto;
import backend.family.dto.FamilyRequestDto;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FamilyService {

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
     * @throws RuntimeException if the email is already registered
     */
    public void register(FamilyRequestDto dto) {
        if (familyRepository.existsById(dto.email())) {
            throw new RuntimeException("Email already in use");
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
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(dto.password(), family.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String accessToken = jwtUtil.generateAccessToken(family.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(family);
        setRefreshTokenCookie(response, refreshToken.getToken());

        return new FamilyAuthResponseDto(accessToken);
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
        String accessToken = jwtUtil.generateAccessToken(rotated.getFamily().getEmail());
        setRefreshTokenCookie(response, rotated.getToken());
        return new FamilyAuthResponseDto(accessToken);
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
    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refreshToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set to true in production
        cookie.setPath("/api/families/refresh");
        cookie.setMaxAge(24 * 60 * 60);
        response.addCookie(cookie);
    }
}