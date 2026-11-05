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

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.lang.NonNull;
import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
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
    private SimpUserRegistry userRegistry;

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
    private String otherFamilyEmail;
    private Long otherUserId;

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

        // A second family, whose members must not be able to touch the first one's chat.
        otherFamilyEmail = "other-chat-test@family.com";
        Family otherFamily = new Family();
        otherFamily.setEmail(otherFamilyEmail);
        otherFamily.setPassword("hashed-password");
        familyRepository.save(otherFamily);

        User otherUser = new User();
        otherUser.setName("Svend");
        otherUser.setEmail("s@test.com");
        otherUser.setRole("PARENT");
        otherUser.setFamily(otherFamily);
        otherUser.setImage(avatar);
        userRepository.save(otherUser);
        otherUserId = otherUser.getId();

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        JacksonJsonMessageConverter converter = new JacksonJsonMessageConverter();
        stompClient.setMessageConverter(converter);

        errors.clear();
    }

    @AfterEach
    void tearDown() {
        stompClient.stop();
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

        session.subscribe("/topic/messages." + familyEmail, new StompFrameHandler() {
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
    @DisplayName("server offers 10 s heartbeats so an idle connection is not closed by a proxy")
    void serverOffersHeartbeats() throws Exception {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setThreadNamePrefix("test-heartbeat-");
        scheduler.initialize();
        stompClient.setTaskScheduler(scheduler);
        stompClient.setDefaultHeartbeat(new long[]{10_000, 10_000});

        BlockingQueue<StompHeaders> connected = new LinkedBlockingQueue<>();
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + jwtUtil.generateAccessToken(familyEmail));

        StompSession session = stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {
                    @Override
                    public void afterConnected(@NonNull StompSession session, @NonNull StompHeaders connectedHeaders) {
                        connected.add(connectedHeaders);
                    }
                }
        ).get(5, TimeUnit.SECONDS);

        StompHeaders connectedHeaders = connected.poll(5, TimeUnit.SECONDS);

        assertThat(connectedHeaders).as("CONNECTED frame").isNotNull();
        assertThat(connectedHeaders.getHeartbeat()).containsExactly(10_000L, 10_000L);

        session.disconnect();
        scheduler.shutdown();
    }

    @Test
    @DisplayName("a member of another family cannot subscribe to this family's topic")
    void rejectsSubscriptionToAnotherFamilysTopic() throws Exception {
        BlockingQueue<StompHeaders> intruderErrors = new LinkedBlockingQueue<>();
        StompSession intruder = connect(jwtUtil.generateAccessToken(otherFamilyEmail), intruderErrors);
        StompSession member = connect(jwtUtil.generateAccessToken(familyEmail), new LinkedBlockingQueue<>());
        BlockingQueue<MessageResponseDto> memberInbox = subscribe(member, familyEmail, "/topic/messages." + familyEmail);

        BlockingQueue<MessageResponseDto> stolen = new LinkedBlockingQueue<>();
        intruder.subscribe("/topic/messages." + familyEmail, collectingInto(stolen));

        assertThat(intruderErrors.poll(5, TimeUnit.SECONDS))
                .as("server answers the forbidden SUBSCRIBE with an ERROR frame")
                .isNotNull();

        member.send("/app/chat", new MessageRequestDto(userId, "Privat besked", familyEmail));

        assertThat(memberInbox.poll(10, TimeUnit.SECONDS)).as("the real member gets it").isNotNull();
        assertThat(stolen.poll(1, TimeUnit.SECONDS)).as("the intruder gets nothing").isNull();

        member.disconnect();
    }

    @Test
    @DisplayName("a family can subscribe to its own topic (the receipt arrives, no error)")
    void allowsSubscriptionToOwnTopic() throws Exception {
        BlockingQueue<StompHeaders> sessionErrors = new LinkedBlockingQueue<>();
        StompSession member = connect(jwtUtil.generateAccessToken(familyEmail), sessionErrors);

        subscribe(member, familyEmail, "/topic/messages." + familyEmail); // fails the test if no receipt arrives

        assertThat(sessionErrors).isEmpty();
        member.disconnect();
    }

    @Test
    @DisplayName("a message sent as a user of another family is dropped: not saved, not broadcast")
    void rejectsSendingAsAnotherFamilysUser() throws Exception {
        StompSession member = connect(jwtUtil.generateAccessToken(familyEmail), new LinkedBlockingQueue<>());
        BlockingQueue<MessageResponseDto> inbox = subscribe(member, familyEmail, "/topic/messages." + familyEmail);

        // Claims to be Svend (other family) and to write into this family's chat.
        member.send("/app/chat", new MessageRequestDto(otherUserId, "Falsk besked", familyEmail));
        member.send("/app/chat", new MessageRequestDto(userId, "Rigtig besked", familyEmail));

        MessageResponseDto first = inbox.poll(10, TimeUnit.SECONDS);
        assertThat(first).as("the legitimate message").isNotNull();
        assertThat(first.content()).isEqualTo("Rigtig besked");
        assertThat(inbox.poll(1, TimeUnit.SECONDS)).as("nothing else was broadcast").isNull();

        assertThat(messageRepository.findAllByUser_Family_EmailOrderByTimestampAsc(familyEmail))
                .extracting(m -> m.getContent()).containsExactly("Rigtig besked");
        assertThat(messageRepository.findAllByUser_Family_EmailOrderByTimestampAsc(otherFamilyEmail)).isEmpty();

        member.disconnect();
    }

    @Test
    @DisplayName("the familyEmail in the payload is ignored: the message goes to the sender's own family")
    void ignoresClaimedFamilyEmail() throws Exception {
        StompSession intruder = connect(jwtUtil.generateAccessToken(otherFamilyEmail), new LinkedBlockingQueue<>());
        StompSession victim = connect(jwtUtil.generateAccessToken(familyEmail), new LinkedBlockingQueue<>());
        BlockingQueue<MessageResponseDto> victimInbox = subscribe(victim, familyEmail, "/topic/messages." + familyEmail);
        BlockingQueue<MessageResponseDto> intruderInbox = subscribe(intruder, otherFamilyEmail, "/topic/messages." + otherFamilyEmail);

        // Svend is in the other family but claims the message is for the first family.
        intruder.send("/app/chat", new MessageRequestDto(otherUserId, "Spam", familyEmail));

        MessageResponseDto own = intruderInbox.poll(10, TimeUnit.SECONDS);
        assertThat(own).as("delivered to the sender's own family").isNotNull();
        assertThat(own.content()).isEqualTo("Spam");
        assertThat(victimInbox.poll(1, TimeUnit.SECONDS)).as("never reaches the claimed family").isNull();
        assertThat(messageRepository.findAllByUser_Family_EmailOrderByTimestampAsc(familyEmail)).isEmpty();

        intruder.disconnect();
        victim.disconnect();
    }

    @Test
    @DisplayName("a client cannot publish straight to another family's topic")
    void rejectsDirectPublishToATopic() throws Exception {
        BlockingQueue<StompHeaders> intruderErrors = new LinkedBlockingQueue<>();
        StompSession intruder = connect(jwtUtil.generateAccessToken(otherFamilyEmail), intruderErrors);
        StompSession member = connect(jwtUtil.generateAccessToken(familyEmail), new LinkedBlockingQueue<>());
        BlockingQueue<MessageResponseDto> memberInbox = subscribe(member, familyEmail, "/topic/messages." + familyEmail);

        intruder.send("/topic/messages." + familyEmail,
                new MessageResponseDto(99L, "Falsk besked", LocalDateTime.now(), "Svend", otherUserId, null));

        assertThat(intruderErrors.poll(5, TimeUnit.SECONDS)).as("ERROR frame").isNotNull();
        assertThat(memberInbox.poll(1, TimeUnit.SECONDS)).as("nothing delivered").isNull();

        member.disconnect();
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

    /** Connects with the given token; any ERROR frame the server sends is put into {@code errorFrames}. */
    private StompSession connect(String token, BlockingQueue<StompHeaders> errorFrames) throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + token);
        return stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {
                    @Override
                    public void handleFrame(@NonNull StompHeaders headers, Object payload) {
                        errorFrames.add(headers);
                    }
                }
        ).get(5, TimeUnit.SECONDS);
    }

    private static StompFrameHandler collectingInto(BlockingQueue<MessageResponseDto> inbox) {
        return new StompFrameHandler() {
            @Override
            @NonNull
            public Type getPayloadType(@NonNull StompHeaders headers) {
                return MessageResponseDto.class;
            }

            @Override
            public void handleFrame(@NonNull StompHeaders headers, Object payload) {
                inbox.add((MessageResponseDto) payload);
            }
        };
    }

    /**
     * Subscribes and waits until the server has registered the subscription (no sleeping). The simple
     * broker does not send RECEIPT frames, so the server's own subscription registry is polled instead.
     */
    private BlockingQueue<MessageResponseDto> subscribe(StompSession session, String familyOfSession,
                                                        String destination) throws Exception {
        BlockingQueue<MessageResponseDto> inbox = new LinkedBlockingQueue<>();
        session.subscribe(destination, collectingInto(inbox));

        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (!isSubscribed(familyOfSession, destination)) {
            assertThat(System.nanoTime()).as("subscription to %s registered by the server", destination)
                    .isLessThan(deadline);
            Thread.sleep(20);
        }
        return inbox;
    }

    private boolean isSubscribed(String user, String destination) {
        SimpUser simpUser = userRegistry.getUser(user);
        return simpUser != null && simpUser.getSessions().stream()
                .flatMap(session -> session.getSubscriptions().stream())
                .anyMatch(subscription -> destination.equals(subscription.getDestination()));
    }

    private String getWsUrl() {
        return "ws://localhost:" + port + "/websocket";
    }
}