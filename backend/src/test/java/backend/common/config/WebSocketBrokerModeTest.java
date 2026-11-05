package backend.common.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import backend.common.security.WebSocketAuthInterceptor;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.broker.SimpleBrokerMessageHandler;
import org.springframework.messaging.simp.stomp.StompBrokerRelayMessageHandler;

/**
 * Checks which message broker the WebSocket configuration sets up. Only the WebSocket configuration is
 * started (no database), so this runs without Docker.
 */
class WebSocketBrokerModeTest {

    @Configuration
    static class InterceptorConfig {
        @Bean
        WebSocketAuthInterceptor webSocketAuthInterceptor() {
            return mock(WebSocketAuthInterceptor.class);
        }
    }

    private final WebApplicationContextRunner runner = new WebApplicationContextRunner()
            .withUserConfiguration(WebSocketConfig.class, InterceptorConfig.class);

    @Test
    @DisplayName("defaults to Spring's in-memory broker with 10 s heartbeats")
    void defaultsToSimpleBroker() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(SimpleBrokerMessageHandler.class);
            assertThat(context).doesNotHaveBean(StompBrokerRelayMessageHandler.class);
            assertThat(context.getBean(SimpleBrokerMessageHandler.class).getHeartbeatValue())
                    .containsExactly(10_000L, 10_000L);
        });
    }

    @Test
    @DisplayName("relay mode connects the STOMP relay to the configured broker")
    void relayModeUsesTheConfiguredBroker() {
        runner.withPropertyValues(
                        "app.broker.mode=relay",
                        "app.broker.relay.host=10.8.0.1",
                        "app.broker.relay.port=61613",
                        "app.broker.relay.login=chat",
                        "app.broker.relay.passcode=secret")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).doesNotHaveBean(SimpleBrokerMessageHandler.class);
                    StompBrokerRelayMessageHandler relay = context.getBean(StompBrokerRelayMessageHandler.class);
                    assertThat(relay.getRelayHost()).isEqualTo("10.8.0.1");
                    assertThat(relay.getRelayPort()).isEqualTo(61613);
                    assertThat(relay.getClientLogin()).isEqualTo("chat");
                    assertThat(relay.getClientPasscode()).isEqualTo("secret");
                    assertThat(relay.getSystemLogin()).isEqualTo("chat");
                    assertThat(relay.getSystemPasscode()).isEqualTo("secret");
                    assertThat(relay.getSystemHeartbeatSendInterval()).isEqualTo(10_000L);
                    assertThat(relay.getSystemHeartbeatReceiveInterval()).isEqualTo(10_000L);
                });
    }

    @Test
    @DisplayName("relay mode without host and login fails at startup and names the missing settings")
    void relayModeWithoutSettingsFailsAtStartup() {
        runner.withPropertyValues("app.broker.mode=relay").run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure()).rootCause()
                    .hasMessageContaining("app.broker.relay.host")
                    .hasMessageContaining("app.broker.relay.login")
                    .hasMessageContaining("app.broker.relay.passcode");
        });
    }

    @Test
    @DisplayName("application.properties maps the APP_BROKER_* environment variables")
    void environmentVariablesSelectTheRelay() {
        runner.withInitializer(new ConfigDataApplicationContextInitializer())
                .withSystemProperties(
                        "APP_BROKER_MODE=relay",
                        "APP_BROKER_RELAY_HOST=rabbit.example",
                        "APP_BROKER_RELAY_PORT=61614",
                        "APP_BROKER_RELAY_LOGIN=chat",
                        "APP_BROKER_RELAY_PASSCODE=secret")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    StompBrokerRelayMessageHandler relay = context.getBean(StompBrokerRelayMessageHandler.class);
                    assertThat(relay.getRelayHost()).isEqualTo("rabbit.example");
                    assertThat(relay.getRelayPort()).isEqualTo(61614);
                });
    }

    @Test
    @DisplayName("application.properties defaults to the simple broker when no variable is set")
    void propertiesFileDefaultsToSimple() {
        runner.withInitializer(new ConfigDataApplicationContextInitializer()).run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(SimpleBrokerMessageHandler.class);
        });
    }
}
