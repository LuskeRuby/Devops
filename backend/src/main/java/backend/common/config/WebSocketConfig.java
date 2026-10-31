package backend.common.config;

import backend.common.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
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
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	/**
	 * Heartbeat interval in milliseconds, in both directions. An idle WebSocket carries no data, and a
	 * proxy such as nginx closes a connection that stays quiet for 60 seconds. With heartbeats the
	 * connection never goes quiet, and a dead peer is noticed within a few intervals.
	 */
	static final long HEARTBEAT_MS = 10_000;

	private final WebSocketAuthInterceptor webSocketAuthInterceptor;

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
		registry.enableSimpleBroker("/topic")
				.setHeartbeatValue(new long[] { HEARTBEAT_MS, HEARTBEAT_MS })
				.setTaskScheduler(messageBrokerTaskScheduler);
		registry.setApplicationDestinationPrefixes("/app");
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(webSocketAuthInterceptor);
	}
}
