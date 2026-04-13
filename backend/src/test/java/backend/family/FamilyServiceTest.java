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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FamilyServiceTest {

    @Mock
    private FamilyRepository familyRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private HttpServletResponse httpResponse;

    @InjectMocks
    private FamilyService familyService;

    private Family testFamily;
    private RefreshToken testRefreshToken;

    @BeforeEach
    void setUp() {
        testFamily = new Family();
        testFamily.setEmail("test@family.com");
        testFamily.setPassword("$2a$10$hashedpassword");

        testRefreshToken = new RefreshToken();
        testRefreshToken.setId(1L);
        testRefreshToken.setToken("refresh-token-uuid");
        testRefreshToken.setFamily(testFamily);
    }

    @Nested
    @DisplayName("register")
    class Register {

        @Test
        @DisplayName("saves family with hashed password")
        void savesWithHashedPassword() {
            FamilyRequestDto dto = new FamilyRequestDto("new@family.com", "password123");
            when(familyRepository.existsById("new@family.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encoded");

            familyService.register(dto);

            ArgumentCaptor<Family> captor = ArgumentCaptor.forClass(Family.class);
            verify(familyRepository).save(captor.capture());
            assertThat(captor.getValue().getEmail()).isEqualTo("new@family.com");
            assertThat(captor.getValue().getPassword()).isEqualTo("$2a$10$encoded");
        }

        @Test
        @DisplayName("throws EmailAlreadyInUseException when email exists")
        void throwsWhenEmailExists() {
            FamilyRequestDto dto = new FamilyRequestDto("existing@family.com", "password123");
            when(familyRepository.existsById("existing@family.com")).thenReturn(true);

            assertThatThrownBy(() -> familyService.register(dto))
                    .isInstanceOf(EmailAlreadyInUseException.class);

            verify(familyRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("returns access token and family email on valid credentials")
        void returnsTokenOnValidCredentials() {
            FamilyLoginDto dto = new FamilyLoginDto("test@family.com", "correctpassword");
            when(familyRepository.findById("test@family.com")).thenReturn(Optional.of(testFamily));
            when(passwordEncoder.matches("correctpassword", "$2a$10$hashedpassword")).thenReturn(true);
            when(jwtUtil.generateAccessToken("test@family.com")).thenReturn("jwt-access-token");
            when(refreshTokenService.createRefreshToken(testFamily)).thenReturn(testRefreshToken);

            FamilyAuthResponseDto result = familyService.login(dto, httpResponse);

            assertThat(result.accessToken()).isEqualTo("jwt-access-token");
            assertThat(result.familyEmail()).isEqualTo("test@family.com");
        }

        @Test
        @DisplayName("sets refresh token cookie in response")
        void setsRefreshTokenCookie() {
            FamilyLoginDto dto = new FamilyLoginDto("test@family.com", "correctpassword");
            when(familyRepository.findById("test@family.com")).thenReturn(Optional.of(testFamily));
            when(passwordEncoder.matches("correctpassword", "$2a$10$hashedpassword")).thenReturn(true);
            when(jwtUtil.generateAccessToken("test@family.com")).thenReturn("jwt-access-token");
            when(refreshTokenService.createRefreshToken(testFamily)).thenReturn(testRefreshToken);

            familyService.login(dto, httpResponse);

            ArgumentCaptor<String> cookieCaptor = ArgumentCaptor.forClass(String.class);
            verify(httpResponse).addHeader(eq("Set-Cookie"), cookieCaptor.capture());
            String cookie = cookieCaptor.getValue();
            assertThat(cookie).contains("refreshToken=refresh-token-uuid");
            assertThat(cookie).contains("HttpOnly");
            assertThat(cookie).contains("Path=/api/families/refresh");
        }

        @Test
        @DisplayName("throws InvalidCredentialsException when email not found")
        void throwsWhenEmailNotFound() {
            FamilyLoginDto dto = new FamilyLoginDto("unknown@family.com", "password");
            when(familyRepository.findById("unknown@family.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> familyService.login(dto, httpResponse))
                    .isInstanceOf(InvalidCredentialsException.class);
        }

        @Test
        @DisplayName("throws InvalidCredentialsException when password is wrong")
        void throwsWhenPasswordWrong() {
            FamilyLoginDto dto = new FamilyLoginDto("test@family.com", "wrongpassword");
            when(familyRepository.findById("test@family.com")).thenReturn(Optional.of(testFamily));
            when(passwordEncoder.matches("wrongpassword", "$2a$10$hashedpassword")).thenReturn(false);

            assertThatThrownBy(() -> familyService.login(dto, httpResponse))
                    .isInstanceOf(InvalidCredentialsException.class);

            verify(jwtUtil, never()).generateAccessToken(any());
        }
    }

    @Nested
    @DisplayName("refresh")
    class Refresh {

        @Test
        @DisplayName("returns new access token with rotated refresh token")
        void returnsNewAccessTokenWithRotatedRefresh() {
            RefreshToken rotatedToken = new RefreshToken();
            rotatedToken.setToken("new-refresh-token");
            rotatedToken.setFamily(testFamily);

            when(refreshTokenService.rotateRefreshToken("old-refresh-token")).thenReturn(rotatedToken);
            when(jwtUtil.generateAccessToken("test@family.com")).thenReturn("new-jwt-token");

            FamilyAuthResponseDto result = familyService.refresh("old-refresh-token", httpResponse);

            assertThat(result.accessToken()).isEqualTo("new-jwt-token");
            assertThat(result.familyEmail()).isEqualTo("test@family.com");
        }

        @Test
        @DisplayName("sets new refresh token cookie after rotation")
        void setsNewCookieAfterRotation() {
            RefreshToken rotatedToken = new RefreshToken();
            rotatedToken.setToken("rotated-token-uuid");
            rotatedToken.setFamily(testFamily);

            when(refreshTokenService.rotateRefreshToken("old-token")).thenReturn(rotatedToken);
            when(jwtUtil.generateAccessToken("test@family.com")).thenReturn("jwt");

            familyService.refresh("old-token", httpResponse);

            ArgumentCaptor<String> cookieCaptor = ArgumentCaptor.forClass(String.class);
            verify(httpResponse).addHeader(eq("Set-Cookie"), cookieCaptor.capture());
            assertThat(cookieCaptor.getValue()).contains("refreshToken=rotated-token-uuid");
        }

        @Test
        @DisplayName("propagates exception when refresh token is invalid")
        void propagatesExceptionOnInvalidToken() {
            when(refreshTokenService.rotateRefreshToken("bad-token"))
                    .thenThrow(new RuntimeException("Invalid refresh token"));

            assertThatThrownBy(() -> familyService.refresh("bad-token", httpResponse))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid refresh token");
        }
    }
}