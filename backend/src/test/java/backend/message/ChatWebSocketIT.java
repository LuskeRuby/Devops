package backend.message;

import backend.family.Family;
import backend.family.FamilyRepository;
import backend.common.security.JwtUtil;
import backend.image.Image;
import backend.image.ImageRepository;
import backend.message.dto.MessageRequestDto;
import backend.message.dto.MessageResponseDto;
import backend.support.AbstractIntegrationTest;
import backend.user.User;
import backend.user.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.lang.NonNull;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;


//Integration test for WebSocket/STOMP flow.
class ChatWebSocketIT extends AbstractIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private MessageRepository messageRepository;

    private WebSocketStompClient stompClient;
    private String familyEmail;
    private Long userId;

    //track any errors
    private final BlockingQueue<Throwable> errors = new LinkedBlockingQueue<>();

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        userRepository.deleteAll();
        familyRepository.deleteAll();

        familyEmail = "chat-test@family.com";

        Family family = new Family();
        family.setEmail(familyEmail);
        family.setPassword("hashed-password");
        familyRepository.save(family);

        Image avatar = new Image();
        avatar.setType("AVATAR");
        avatar.setImage(new byte[]{1, 2, 3});
        imageRepository.save(avatar);

        User user = new User();
        user.setName("Anders");
        user.setEmail("a@test.com");
        user.setRole("PARENT");
        user.setFamily(family);
        user.setImage(avatar);
        userRepository.save(user);
        userId = user.getId();

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        converter.setObjectMapper(mapper);
        stompClient.setMessageConverter(converter);

        errors.clear();
    }

   //capture serverside exceptions
    private StompSessionHandlerAdapter errorCapturingHandler() {
        return new StompSessionHandlerAdapter() {
            @Override
            public void handleException(@NonNull StompSession session, StompCommand command,
                                        @NonNull StompHeaders headers, @NonNull byte[] payload,
                                        @NonNull Throwable exception) {
                System.err.println("STOMP exception: " + exception.getMessage());
                errors.add(exception);
            }

            @Override
            public void handleTransportError(@NonNull StompSession session, @NonNull Throwable exception) {
                System.err.println("STOMP transport error: " + exception.getMessage());
                errors.add(exception);
            }

            @Override
            public void handleFrame(@NonNull StompHeaders headers, Object payload) {
                System.err.println("STOMP ERROR frame: " + payload);
            }
        };
    }

    @Test
    @DisplayName("authenticated client sends message and receives it on family topic")
    void sendAndReceiveMessage() throws Exception {
        String token = jwtUtil.generateAccessToken(familyEmail);
        BlockingQueue<MessageResponseDto> received = new LinkedBlockingQueue<>();

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + token);

        StompSession session = stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                errorCapturingHandler()
        ).get(5, TimeUnit.SECONDS);

        session.subscribe("/topic/messages/" + familyEmail, new StompFrameHandler() {
            @Override
            @NonNull
            public Type getPayloadType(@NonNull StompHeaders headers) {
                return MessageResponseDto.class;
            }

            @Override
            public void handleFrame(@NonNull StompHeaders headers, Object payload) {
                received.add((MessageResponseDto) payload);
            }
        });

        Thread.sleep(500);

        MessageRequestDto request = new MessageRequestDto(userId, "Hej fra test!", familyEmail);
        session.send("/app/chat", request);

        MessageResponseDto response = received.poll(10, TimeUnit.SECONDS);

        // If no response, check if there was a server-side error
        if (response == null) {
            Throwable error = errors.poll();
            if (error != null) {
                throw new AssertionError("Server-side STOMP error: " + error.getMessage(), error);
            }
        }

        assertThat(response).as("Should receive message on family topic").isNotNull();
        assertThat(response.content()).isEqualTo("Hej fra test!");
        assertThat(response.username()).isEqualTo("Anders");
        assertThat(response.userId()).isEqualTo(userId);
        assertThat(response.imageId()).isNotNull();
        assertThat(response.timestamp()).isNotNull();

        assertThat(messageRepository.findAllByUser_Family_EmailOrderByTimestampAsc(familyEmail))
                .hasSize(1);

        session.disconnect();
    }

    @Test
    @DisplayName("rejected conn without JWT token")
    void rejectsConnectionWithoutToken() {
        StompHeaders connectHeaders = new StompHeaders();

        try {
            stompClient.connectAsync(
                    getWsUrl(),
                    new WebSocketHttpHeaders(),
                    connectHeaders,
                    errorCapturingHandler()
            ).get(5, TimeUnit.SECONDS);

            assertThat(true).as("Expected connection to be rejected").isFalse();
        } catch (Exception e) {
            assertThat(e).isNotNull();
        }
    }

    @Test
    @DisplayName("conn is rejected invalid JWT token")
    void rejectsConnectionWithInvalidToken() {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer invalid.token.here");

        try {
            stompClient.connectAsync(
                    getWsUrl(),
                    new WebSocketHttpHeaders(),
                    connectHeaders,
                    errorCapturingHandler()
            ).get(5, TimeUnit.SECONDS);

            assertThat(true).as("Expected connection to be rejected").isFalse();
        } catch (Exception e) {
            assertThat(e).isNotNull();
        }
    }

    private String getWsUrl() {
        return "ws://localhost:" + port + "/websocket";
    }
}