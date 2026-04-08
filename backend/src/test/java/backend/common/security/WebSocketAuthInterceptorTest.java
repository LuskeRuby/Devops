package backend.common.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthInterceptorTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private MessageChannel channel;

    @InjectMocks
    private WebSocketAuthInterceptor interceptor;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final String INVALID_TOKEN = "invalid.jwt.token";
    private static final String TEST_EMAIL = "family@test.com";

    private Message<?> buildConnectMessage(String authHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        if (authHeader != null) {
            accessor.addNativeHeader("Authorization", authHeader);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<?> buildSendMessage() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setDestination("/app/chat");
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Nested
    @DisplayName("CONNECT frame")
    class ConnectFrame {

        @Test
        @DisplayName("authenticates user with valid JWT token")
        void authenticatesWithValidToken() {
            when(jwtUtil.isTokenValid(VALID_TOKEN)).thenReturn(true);
            when(jwtUtil.extractEmail(VALID_TOKEN)).thenReturn(TEST_EMAIL);

            Message<?> connectMessage = buildConnectMessage("Bearer " + VALID_TOKEN);
            Message<?> result = interceptor.preSend(connectMessage, channel);

            assertThat(result).isNotNull();
            verify(jwtUtil).isTokenValid(VALID_TOKEN);
            verify(jwtUtil).extractEmail(VALID_TOKEN);
        }

        @Test
        @DisplayName("rejects when Authorization header is missing")
        void rejectsWhenNoAuthHeader() {
            Message<?> connectMessage = buildConnectMessage(null);

            assertThatThrownBy(() -> interceptor.preSend(connectMessage, channel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Missing or invalid Authorization header");
        }

        @Test
        @DisplayName("rejects when Authorization header has wrong prefix")
        void rejectsWhenWrongPrefix() {
            Message<?> connectMessage = buildConnectMessage("Basic some-credentials");

            assertThatThrownBy(() -> interceptor.preSend(connectMessage, channel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Missing or invalid Authorization header");
        }

        @Test
        @DisplayName("rejects when JWT token is invalid")
        void rejectsWhenTokenInvalid() {
            when(jwtUtil.isTokenValid(INVALID_TOKEN)).thenReturn(false);

            Message<?> connectMessage = buildConnectMessage("Bearer " + INVALID_TOKEN);

            assertThatThrownBy(() -> interceptor.preSend(connectMessage, channel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Invalid or expired JWT token");
        }
    }

    @Nested
    @DisplayName("Non-CONNECT frames")
    class NonConnectFrames {

        @Test
        @DisplayName("passes SEND frames through without authentication check")
        void passesSendFramesThrough() {
            Message<?> sendMessage = buildSendMessage();
            Message<?> result = interceptor.preSend(sendMessage, channel);

            assertThat(result).isNotNull();
        }
    }
}