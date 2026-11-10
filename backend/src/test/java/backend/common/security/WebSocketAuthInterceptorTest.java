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
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

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
        accessor.setLeaveMutable(true); // like the messages of a real session
        if (authHeader != null) {
            accessor.addNativeHeader("Authorization", authHeader);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<?> buildFrame(StompCommand command, String destination, String user) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setDestination(destination);
        if (user != null) {
            accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, List.of()));
        }
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
            // The user must end up on the message itself: the session keeps it for all later frames.
            StompHeaderAccessor after = MessageHeaderAccessor.getAccessor(connectMessage, StompHeaderAccessor.class);
            assertThat(after).isNotNull();
            assertThat(after.getUser()).isNotNull();
            assertThat(after.getUser().getName()).isEqualTo(TEST_EMAIL);
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
    @DisplayName("SUBSCRIBE frame")
    class SubscribeFrame {

        @Test
        @DisplayName("allows the family's own topic")
        void allowsOwnTopic() {
            Message<?> frame = buildFrame(StompCommand.SUBSCRIBE, "/topic/messages." + TEST_EMAIL, TEST_EMAIL);

            assertThat(interceptor.preSend(frame, channel)).isSameAs(frame);
        }

        @Test
        @DisplayName("rejects another family's topic")
        void rejectsOtherFamilyTopic() {
            Message<?> frame = buildFrame(StompCommand.SUBSCRIBE, "/topic/messages.other@test.com", TEST_EMAIL);

            assertThatThrownBy(() -> interceptor.preSend(frame, channel))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("rejects a topic that only starts with the family's own name")
        void rejectsPrefixMatch() {
            Message<?> frame = buildFrame(StompCommand.SUBSCRIBE, "/topic/messages." + TEST_EMAIL + ".evil", TEST_EMAIL);

            assertThatThrownBy(() -> interceptor.preSend(frame, channel))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("rejects wildcards and any other destination")
        void rejectsOtherDestinations() {
            for (String destination : List.of("/topic/messages.*", "/topic/#", "/topic/other", "/queue/x")) {
                Message<?> frame = buildFrame(StompCommand.SUBSCRIBE, destination, TEST_EMAIL);

                assertThatThrownBy(() -> interceptor.preSend(frame, channel))
                        .as(destination)
                        .isInstanceOf(AccessDeniedException.class);
            }
        }

        @Test
        @DisplayName("rejects a subscription without an authenticated user")
        void rejectsWithoutUser() {
            Message<?> frame = buildFrame(StompCommand.SUBSCRIBE, "/topic/messages." + TEST_EMAIL, null);

            assertThatThrownBy(() -> interceptor.preSend(frame, channel))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("SEND frame")
    class SendFrame {

        @Test
        @DisplayName("allows the application destination")
        void allowsApplicationDestination() {
            Message<?> frame = buildFrame(StompCommand.SEND, "/app/chat", TEST_EMAIL);

            assertThat(interceptor.preSend(frame, channel)).isSameAs(frame);
        }

        @Test
        @DisplayName("rejects publishing straight to a topic, which would impersonate the server")
        void rejectsDirectTopicPublish() {
            Message<?> frame = buildFrame(StompCommand.SEND, "/topic/messages.other@test.com", TEST_EMAIL);

            assertThatThrownBy(() -> interceptor.preSend(frame, channel))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("rejects a SEND without an authenticated user")
        void rejectsWithoutUser() {
            Message<?> frame = buildFrame(StompCommand.SEND, "/app/chat", null);

            assertThatThrownBy(() -> interceptor.preSend(frame, channel))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("Other frames")
    class OtherFrames {

        @Test
        @DisplayName("passes frames such as UNSUBSCRIBE through")
        void passesOtherFramesThrough() {
            Message<?> frame = buildFrame(StompCommand.UNSUBSCRIBE, null, TEST_EMAIL);

            assertThat(interceptor.preSend(frame, channel)).isSameAs(frame);
        }
    }
}
