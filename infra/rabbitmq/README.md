# RabbitMQ

The message broker for the chat. With one backend, Spring's in-memory broker is enough. With several
backends it is not: each instance only knows its own WebSocket clients, so a message saved through one
backend would never reach the clients connected to another. In relay mode every backend connects to
RabbitMQ over STOMP and publishes and subscribes there, so all clients see all messages.

The messages themselves stay in PostgreSQL. RabbitMQ only fans them out to connected clients: a STOMP
subscription creates a temporary queue, and a message sent while nobody is subscribed is dropped. The
clients load the history again when they reconnect.

| File | Purpose |
|---|---|
| `docker-compose.yml` | the service: image, healthcheck, volume, ports, logging |
| `enabled_plugins` | enables `rabbitmq_stomp` and `rabbitmq_management` (not enabled in the image) |

`docker-compose.prod-frontend.yml` includes the service on Server B. It is not part of the dev or CI
stack: both keep Spring's in-memory broker.

## Configuration

| Variable | Production (Server B) |
|---|---|
| `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | `.env` on Server B, written by the release workflow from the `RABBITMQ_USER` / `RABBITMQ_PASSWORD` secrets. A `'` in a secret breaks that file, so do not use one. |
| `RABBITMQ_BIND` | Server B's WireGuard address (`IP_FRONTEND_WG`) |

There are no defaults, so Compose stops with an error if one is missing. The credentials are read only
when the data volume is first created; to change them later use `rabbitmqctl change_password`.

Ports:

- **61613 (STOMP)** is published only on `RABBITMQ_BIND`, the tunnel address, for the backends on Server A.
- **15672 (management UI)** is published on `127.0.0.1` of Server B only. Reach it with an SSH tunnel:
  `ssh -L 15672:127.0.0.1:15672 user@<server B>`, then open http://localhost:15672.
- 5672 (AMQP) is not published: the backends use STOMP.

## Try it locally

```bash
RABBITMQ_BIND=127.0.0.1 RABBITMQ_USER=dev RABBITMQ_PASSWORD=dev \
  docker compose -f infra/rabbitmq/docker-compose.yml up
```

Check that the STOMP plugin is on and listening:

```bash
docker compose -f infra/rabbitmq/docker-compose.yml exec rabbitmq rabbitmq-plugins list -e
docker compose -f infra/rabbitmq/docker-compose.yml exec rabbitmq rabbitmq-diagnostics listeners
```

`rabbitmq_stomp` should be listed, and a listener on port 61613 (protocol `stomp`) should be shown.

## Known limits

- One node. If it stops, chat stops until it is back; the backends and the browsers reconnect by
  themselves and the browsers load the missed messages.
- The broker login can do everything on the broker (it is the default user the image creates). Spring
  checks who may subscribe to what. A broker user limited to the `amq.topic` exchange is a possible
  hardening step.
- No TLS on STOMP: the traffic only crosses the WireGuard tunnel.
