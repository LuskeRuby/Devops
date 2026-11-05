package backend.message;

import backend.common.security.JwtUtil;
import backend.family.Family;
import backend.family.FamilyRepository;
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
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.testcontainers.rabbitmq.RabbitMQContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

import java.lang.reflect.Type;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The chat with the STOMP broker relay switched on, against a real RabbitMQ.
 *
 * <p>The tests use a second STOMP client that talks to RabbitMQ directly, without going through the
 * backend. It stands in for another backend instance: a message that reaches it, or that it sends
 * and a browser receives, has crossed the broker and not the backend's own memory.</p>
 */
class ChatRelayWebSocketIT extends AbstractIntegrationTest {

    private static final String BROKER_USER = "chat";
    private static final String BROKER_PASSWORD = "chat-secret";
    private static final int STOMP_PORT = 61613;

    // Same image as infra/rabbitmq, with the repository's own plugin list, so this test also proves that
    // the file enables STOMP.
    @SuppressWarnings("resource")
    private static final RabbitMQContainer RABBIT =
            new RabbitMQContainer(DockerImageName.parse("rabbitmq:4.4-management-alpine"))
                    .withAdminUser(BROKER_USER)
                    .withAdminPassword(BROKER_PASSWORD)
                    .withCopyFileToContainer(
                            MountableFile.forHostPath(Path.of("..", "infra", "rabbitmq", "enabled_plugins")),
                            "/etc/rabbitmq/enabled_plugins")
                    .withExposedPorts(STOMP_PORT);

    static {
        RABBIT.start();
    }

    @DynamicPropertySource
    static void relayProperties(DynamicPropertyRegistry registry) {
        registry.add("app.broker.mode", () -> "relay");
        registry.add("app.broker.relay.host", RABBIT::getHost);
        registry.add("app.broker.relay.port", () -> RABBIT.getMappedPort(STOMP_PORT));
        registry.add("app.broker.relay.login", () -> BROKER_USER);
        registry.add("app.broker.relay.passcode", () -> BROKER_PASSWORD);
    }

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

    private ThreadPoolTaskScheduler scheduler;
    private WebSocketStompClient browserClient;
    private ReactorNettyTcpStompClient brokerClient;
    private String familyEmail;
    private Long userId;
    private String otherFamilyEmail;
    private Long otherUserId;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        userRepository.deleteAll();
        familyRepository.deleteAll();

        familyEmail = "relay-test@family.com";

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

        otherFamilyEmail = "other-relay-test@family.com";
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

        // The STOMP clients need a scheduler to track receipts (the confirmation of a subscription).
        scheduler = new ThreadPoolTaskScheduler();
        scheduler.setThreadNamePrefix("test-stomp-");
        scheduler.initialize();

        browserClient = new WebSocketStompClient(new StandardWebSocketClient());
        browserClient.setMessageConverter(new JacksonJsonMessageConverter());
        browserClient.setTaskScheduler(scheduler);

        brokerClient = new ReactorNettyTcpStompClient(RABBIT.getHost(), RABBIT.getMappedPort(STOMP_PORT));
        brokerClient.setMessageConverter(new JacksonJsonMessageConverter());
        brokerClient.setTaskScheduler(scheduler);
    }

    @AfterEach
    void tearDown() {
        browserClient.stop();
        brokerClient.shutdown();
        scheduler.shutdown();
    }

    @Test
    @DisplayName("a message sent through the backend reaches a subscriber that is connected to RabbitMQ only")
    void messageSentThroughTheBackendReachesTheBroker() throws Exception {
        String destination = "/topic/messages." + familyEmail;

        // Stands in for another backend instance: it never talks to this backend.
        StompSession brokerSession = connectToBroker();
        BlockingQueue<MessageResponseDto> otherInstance = subscribe(brokerSession, destination);

        StompSession browser = connectBrowser(jwtUtil.generateAccessToken(familyEmail));
        browser.send("/app/chat", new MessageRequestDto(userId, "Hej via RabbitMQ!", familyEmail));

        MessageResponseDto received = otherInstance.poll(10, TimeUnit.SECONDS);

        assertThat(received).as("message delivered through RabbitMQ").isNotNull();
        assertThat(received.content()).isEqualTo("Hej via RabbitMQ!");
        assertThat(received.username()).isEqualTo("Anders");
        assertThat(received.userId()).isEqualTo(userId);
        assertThat(messageRepository.findAllByUser_Family_EmailOrderByTimestampAsc(familyEmail)).hasSize(1);

        browser.disconnect();
        brokerSession.disconnect();
    }

    @Test
    @DisplayName("a message published on the broker reaches a browser connected to the backend")
    void messageFromTheBrokerReachesTheBrowser() throws Exception {
        String destination = "/topic/messages." + familyEmail;

        StompSession browser = connectBrowser(jwtUtil.generateAccessToken(familyEmail));
        BlockingQueue<MessageResponseDto> browserInbox = subscribe(browser, destination);

        // Stands in for a message that another backend instance saved and published.
        StompSession brokerSession = connectToBroker();
        MessageResponseDto fromOtherInstance = new MessageResponseDto(
                42L, "Hej fra en anden instans", LocalDateTime.now(), "Svend", 7L, null);
        brokerSession.send(destination, fromOtherInstance);

        MessageResponseDto received = browserInbox.poll(10, TimeUnit.SECONDS);

        assertThat(received).as("message delivered to the browser").isNotNull();
        assertThat(received.id()).isEqualTo(42L);
        assertThat(received.content()).isEqualTo("Hej fra en anden instans");
        assertThat(received.username()).isEqualTo("Svend");

        browser.disconnect();
        brokerSession.disconnect();
    }

    @Test
    @DisplayName("in relay mode a browser still cannot subscribe to another family's topic")
    void rejectsForeignSubscriptionInRelayMode() throws Exception {
        BlockingQueue<StompHeaders> intruderErrors = new LinkedBlockingQueue<>();
        StompSession intruder = connectBrowser(jwtUtil.generateAccessToken(otherFamilyEmail), intruderErrors);
        intruder.subscribe("/topic/messages." + familyEmail, new StompFrameHandler() {
            @Override
            @NonNull
            public Type getPayloadType(@NonNull StompHeaders headers) {
                return MessageResponseDto.class;
            }

            @Override
            public void handleFrame(@NonNull StompHeaders headers, Object payload) { }
        });

        assertThat(intruderErrors.poll(5, TimeUnit.SECONDS)).as("ERROR frame").isNotNull();
    }

    @Test
    @DisplayName("in relay mode a browser cannot publish straight to the broker topic of another family")
    void rejectsDirectPublishInRelayMode() throws Exception {
        String destination = "/topic/messages." + familyEmail;
        StompSession brokerSession = connectToBroker();
        BlockingQueue<MessageResponseDto> victimInbox = subscribe(brokerSession, destination);

        BlockingQueue<StompHeaders> intruderErrors = new LinkedBlockingQueue<>();
        StompSession intruder = connectBrowser(jwtUtil.generateAccessToken(otherFamilyEmail), intruderErrors);
        intruder.send(destination,
                new MessageResponseDto(99L, "Falsk besked", LocalDateTime.now(), "Svend", otherUserId, null));

        assertThat(intruderErrors.poll(5, TimeUnit.SECONDS)).as("ERROR frame").isNotNull();
        assertThat(victimInbox.poll(1, TimeUnit.SECONDS)).as("nothing reached the broker topic").isNull();

        brokerSession.disconnect();
    }

    @Test
    @DisplayName("a connection without a JWT is still rejected in relay mode")
    void rejectsConnectionWithoutTokenInRelayMode() {
        try {
            browserClient.connectAsync(
                    wsUrl(),
                    new WebSocketHttpHeaders(),
                    new StompHeaders(),
                    new StompSessionHandlerAdapter() { }
            ).get(5, TimeUnit.SECONDS);

            assertThat(true).as("Expected connection to be rejected").isFalse();
        } catch (Exception e) {
            assertThat(e).isNotNull();
        }
    }

    private StompSession connectBrowser(String token) throws Exception {
        return connectBrowser(token, new LinkedBlockingQueue<>());
    }

    /** Connects a browser; any ERROR frame the server sends is put into {@code errorFrames}. */
    private StompSession connectBrowser(String token, BlockingQueue<StompHeaders> errorFrames) throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + token);
        return browserClient.connectAsync(
                wsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {
                    @Override
                    public void handleFrame(@NonNull StompHeaders headers, Object payload) {
                        errorFrames.add(headers);
                    }
                }
        ).get(10, TimeUnit.SECONDS);
    }

    private StompSession connectToBroker() throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.setLogin(BROKER_USER);
        connectHeaders.setPasscode(BROKER_PASSWORD);
        return brokerClient.connectAsync(connectHeaders, new StompSessionHandlerAdapter() { })
                .get(10, TimeUnit.SECONDS);
    }

    /** Subscribes and waits until the broker has confirmed the subscription (no sleeping). */
    private BlockingQueue<MessageResponseDto> subscribe(StompSession session, String destination)
            throws Exception {
        BlockingQueue<MessageResponseDto> received = new LinkedBlockingQueue<>();
        session.setAutoReceipt(true);
        StompSession.Subscription subscription = session.subscribe(destination, new StompFrameHandler() {
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

        CountDownLatch confirmed = new CountDownLatch(1);
        subscription.addReceiptTask(confirmed::countDown);
        assertThat(confirmed.await(10, TimeUnit.SECONDS))
                .as("subscription to %s confirmed by the broker", destination)
                .isTrue();
        return received;
    }

    private String wsUrl() {
        return "ws://localhost:" + port + "/websocket";
    }
}
