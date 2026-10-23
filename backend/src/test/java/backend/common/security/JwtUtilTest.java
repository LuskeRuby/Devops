package backend.common.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final String VALID_SECRET = "0123456789abcdef0123456789abcdef";

    private JwtUtil jwtUtilWithSecret(String secret) {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secret);
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpiration", 60_000L);
        return jwtUtil;
    }

    @Test
    @DisplayName("startup fails when the secret is empty (APP_JWT_SECRET set to an empty value)")
    void emptySecretIsRejected() {
        assertThatThrownBy(() -> jwtUtilWithSecret("").validateSecret())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_JWT_SECRET");
    }

    @Test
    @DisplayName("startup fails when the secret is too short for HS256")
    void shortSecretIsRejected() {
        assertThatThrownBy(() -> jwtUtilWithSecret("too-short").validateSecret())
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("startup accepts a 32 byte secret and it can sign and verify a token")
    void validSecretIsAccepted() {
        JwtUtil jwtUtil = jwtUtilWithSecret(VALID_SECRET);

        assertThatCode(jwtUtil::validateSecret).doesNotThrowAnyException();
        String token = jwtUtil.generateAccessToken("family@example.com");
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("family@example.com");
    }
}
