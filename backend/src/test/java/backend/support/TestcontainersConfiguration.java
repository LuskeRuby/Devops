package backend.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;


//Testcontainers configuration for integration tests
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    private static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    static {
        postgres.start();
    }

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        return postgres;
    }
}