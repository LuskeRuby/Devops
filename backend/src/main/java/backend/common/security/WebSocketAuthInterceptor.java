package backend.common.security;

import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    /** The only place a client may publish to; everything under /topic is written by the server. */
    private static final String APPLICATION_PREFIX = "/app/";

    /** A family's chat topic is this prefix + the family email (the Principal name). */
    private static final String FAMILY_TOPIC_PREFIX = "/topic/messages.";

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // The accessor that belongs to the message itself, not wrap(): wrap() copies the headers, and a
        // user set on a copy is lost, so later SUBSCRIBE/SEND frames of the session would have no user.
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            accessor = StompHeaderAccessor.wrap(message); // read-only use below
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscribe(accessor);
        } else if (StompCommand.SEND.equals(accessor.getCommand())) {
            authorizeSend(accessor);
        } else if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new AccessDeniedException("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.isTokenValid(token)) {
                throw new AccessDeniedException("Invalid or expired JWT token");
            }

            if (MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class) == null) {
                throw new IllegalStateException("CONNECT frame without a mutable header accessor");
            }

            String email = jwtUtil.extractEmail(token);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(email, null, List.of());
            accessor.setUser(auth);
        }

        return message;
    }

    /** Default deny: a client may only follow its own family's topic. */
    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        String destination = accessor.getDestination();

        if (user == null || destination == null
                || !destination.equals(FAMILY_TOPIC_PREFIX + user.getName())) {
            throw new AccessDeniedException("Not allowed to subscribe to " + destination);
        }
    }

    /**
     * Without this, a client could SEND straight to /topic/messages.&lt;other family&gt; and the broker
     * would deliver it as if the server had published it.
     */
    private void authorizeSend(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();

        if (accessor.getUser() == null || destination == null || !destination.startsWith(APPLICATION_PREFIX)) {
            throw new AccessDeniedException("Not allowed to send to " + destination);
        }
    }
}
