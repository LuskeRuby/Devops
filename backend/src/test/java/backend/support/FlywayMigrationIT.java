package backend.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

// Proves the migrations build the schema the entities expect. The context only starts if
// Hibernate's ddl-auto=validate accepts the schema Flyway created, so entity/migration drift fails here.
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class FlywayMigrationIT {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("all migrations are applied and none are pending or failed")
    void allMigrationsApplied() {
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(flyway.info().applied()).isNotEmpty();
        assertThat(flyway.info().applied()).allMatch(m -> m.getState().isApplied());
    }

    @Test
    @DisplayName("every foreign key column has an index")
    void everyForeignKeyIsIndexed() {
        // PostgreSQL does not index foreign keys itself. A foreign key counts as indexed when
        // some index starts with its first column.
        List<String> unindexed = jdbc.queryForList("""
                SELECT c.conname
                FROM pg_constraint c
                WHERE c.contype = 'f'
                  AND c.connamespace = 'public'::regnamespace
                  AND NOT EXISTS (
                    SELECT 1 FROM pg_index i
                    WHERE i.indrelid = c.conrelid
                      AND i.indkey[0] = c.conkey[1])
                """, String.class);
        assertThat(unindexed).as("foreign keys without an index").isEmpty();
    }
}
