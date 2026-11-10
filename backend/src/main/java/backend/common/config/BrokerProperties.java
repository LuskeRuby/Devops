package backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Which message broker carries the chat messages between the backend instances and the browsers.
 *
 * <ul>
 *   <li>{@code simple}: Spring's in-memory broker. Fine for one backend instance, and what dev, CI and
 *       the tests use. With several instances a message would only reach the clients connected to the
 *       instance that received it.</li>
 *   <li>{@code relay}: every instance relays STOMP to an external broker (RabbitMQ with the STOMP
 *       plugin), so all clients see all messages. Needed for more than one backend instance.</li>
 * </ul>
 *
 * Environment variables: {@code APP_BROKER_MODE}, {@code APP_BROKER_RELAY_HOST},
 * {@code APP_BROKER_RELAY_PORT}, {@code APP_BROKER_RELAY_LOGIN}, {@code APP_BROKER_RELAY_PASSCODE}.
 */
@ConfigurationProperties(prefix = "app.broker")
public record BrokerProperties(
		@DefaultValue("simple") Mode mode,
		@DefaultValue Relay relay) {

	public enum Mode {
		SIMPLE, RELAY
	}

	/**
	 * Connection to the external broker. The same login is used for the connection the backend keeps for
	 * itself and for the connections it opens on behalf of each browser.
	 */
	public record Relay(
			String host,
			@DefaultValue("61613") int port,
			String login,
			String passcode) {

		/** Names the settings that are missing, or returns an empty string when the relay can be used. */
		String missing() {
			StringBuilder missing = new StringBuilder();
			if (isBlank(host)) {
				missing.append(" app.broker.relay.host (APP_BROKER_RELAY_HOST)");
			}
			if (isBlank(login)) {
				missing.append(" app.broker.relay.login (APP_BROKER_RELAY_LOGIN)");
			}
			if (isBlank(passcode)) {
				missing.append(" app.broker.relay.passcode (APP_BROKER_RELAY_PASSCODE)");
			}
			return missing.toString().trim();
		}

		private static boolean isBlank(String value) {
			return value == null || value.isBlank();
		}
	}
}
