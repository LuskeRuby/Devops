package backend.common.config;

import backend.common.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@EnableConfigurationProperties(BrokerProperties.class)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	/**
	 * Heartbeat interval in milliseconds, in both directions. An idle WebSocket carries no data, and a
	 * proxy such as nginx closes a connection that stays quiet for 60 seconds. With heartbeats the
	 * connection never goes quiet, and a dead peer is noticed within a few intervals.
	 */
	static final long HEARTBEAT_MS = 10_000;

	private final WebSocketAuthInterceptor webSocketAuthInterceptor;

	private final BrokerProperties brokerProperties;

	private TaskScheduler messageBrokerTaskScheduler;

	// The simple broker needs a scheduler to send heartbeats. @Lazy avoids a circular dependency
	// (the scheduler bean comes from the same WebSocket broker configuration).
	@Autowired
	public void setMessageBrokerTaskScheduler(
			@Lazy @Qualifier("messageBrokerTaskScheduler") TaskScheduler messageBrokerTaskScheduler) {
		this.messageBrokerTaskScheduler = messageBrokerTaskScheduler;
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/websocket")
				.setAllowedOriginPatterns("*");
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		switch (brokerProperties.mode()) {
			case SIMPLE -> registry.enableSimpleBroker("/topic")
					.setHeartbeatValue(new long[] { HEARTBEAT_MS, HEARTBEAT_MS })
					.setTaskScheduler(messageBrokerTaskScheduler);
			case RELAY -> enableRelay(registry, brokerProperties.relay());
		}
		registry.setApplicationDestinationPrefixes("/app");
	}

	private static void enableRelay(MessageBrokerRegistry registry, BrokerProperties.Relay relay) {
		String missing = relay.missing();
		if (!missing.isEmpty()) {
			// Fail at startup with a clear message instead of a broker that silently never connects.
			throw new IllegalStateException("app.broker.mode=relay needs: " + missing);
		}
		registry.enableStompBrokerRelay("/topic")
				.setRelayHost(relay.host())
				.setRelayPort(relay.port())
				.setClientLogin(relay.login())
				.setClientPasscode(relay.passcode())
				.setSystemLogin(relay.login())
				.setSystemPasscode(relay.passcode())
				// Heartbeats of the backend's own connection to the broker; the browsers' heartbeats are
				// negotiated end to end with the broker.
				.setSystemHeartbeatSendInterval(HEARTBEAT_MS)
				.setSystemHeartbeatReceiveInterval(HEARTBEAT_MS);
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(webSocketAuthInterceptor);
	}
}
