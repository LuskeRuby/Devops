package backend.task;

import backend.family.Family;
import backend.support.TestcontainersConfiguration;
import backend.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Repository integration test with Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class TaskRepositoryIT {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TestEntityManager entityManager;

    // ─── helpers ─────────────────────────────────────────────────────────────────

    private Family persistFamily(String email) {
        Family family = new Family();
        family.setEmail(email);
        family.setPassword("hashed-password");
        return entityManager.persist(family);
    }

    private User persistUser(String name, String email, String role, Family family) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setFamily(family);
        return entityManager.persist(user);
    }

    private Task persistTask(String name, List<User> users) {
        Task task = new Task();
        task.setName(name);
        task.setPoints(5);
        task.setChecked(false);
        task.setUsers(users);
        return entityManager.persist(task);
    }

    // ─── findByUsers_Id ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByUsers_Id returns tasks assigned to a specific user")
    void findByUsers_Id_returnsMatchingTasks() {
        Family family = persistFamily("task-test@family.com");
        User user = persistUser("Anders", "a@a.com", "PARENT", family);

        persistTask("Clean kitchen", List.of(user));
        persistTask("Do laundry", List.of(user));

        User otherUser = persistUser("Svend", "s@s.com", "CHILD", family);
        persistTask("Walk dog", List.of(otherUser));

        entityManager.flush();

        List<Task> result = taskRepository.findByUsers_Id(user.getId());

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Task::getName)
                .containsExactlyInAnyOrder("Clean kitchen", "Do laundry");
    }

    @Test
    @DisplayName("findByUsers_Id returns empty when user has no tasks")
    void findByUsers_Id_returnsEmptyWhenNoTasks() {
        Family family = persistFamily("empty@family.com");
        User user = persistUser("Ida", "i@i.com", "CHILD", family);
        entityManager.flush();

        List<Task> result = taskRepository.findByUsers_Id(user.getId());

        assertThat(result).isEmpty();
    }

    // ─── findDistinctByUsers_Family_Email ────────────────────────────────────────

    @Test
    @DisplayName("findDistinctByUsers_Family_Email returns tasks for all users in a family")
    void findDistinctByUsers_Family_Email_returnsAllFamilyTasks() {
        Family family = persistFamily("fam@family.com");
        User parent = persistUser("Hans", "h@h.com", "PARENT", family);
        User child = persistUser("Lotte", "l@l.com", "CHILD", family);

        persistTask("Cook dinner", List.of(parent));
        persistTask("Homework", List.of(child));

        Family otherFamily = persistFamily("other@family.com");
        User otherUser = persistUser("Bob", "b@b.com", "PARENT", otherFamily);
        persistTask("Mow lawn", List.of(otherUser));

        entityManager.flush();

        List<Task> result = taskRepository.findDistinctByUsers_Family_Email("fam@family.com");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Task::getName)
                .containsExactlyInAnyOrder("Cook dinner", "Homework");
    }

    @Test
    @DisplayName("findDistinctByUsers_Family_Email returns each shared task only once")
    void findDistinctByUsers_Family_Email_returnsEachTaskOnce() {
        Family family = persistFamily("distinct@family.com");
        User parent = persistUser("Per", "p@p.com", "PARENT", family);
        User child = persistUser("Maja", "m@m.com", "CHILD", family);

        persistTask("Shared chore", List.of(parent, child));
        entityManager.flush();

        List<Task> result = taskRepository.findDistinctByUsers_Family_Email("distinct@family.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Shared chore");
    }

    @Test
    @DisplayName("findDistinctByUsers_Family_Email returns empty for unknown family")
    void findDistinctByUsers_Family_Email_returnsEmptyForUnknownFamily() {
        List<Task> result = taskRepository.findDistinctByUsers_Family_Email("ghost@family.com");

        assertThat(result).isEmpty();
    }

    // ─── persistence ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("save and retrieve task persists all fields correctly")
    void saveAndRetrieve_persistsAllFields() {
        Family family = persistFamily("persist@family.com");
        User user = persistUser("Karl", "k@k.com", "PARENT", family);

        Task task = new Task();
        task.setName("Buy groceries");
        task.setDescription("Milk and eggs");
        task.setPoints(15);
        task.setChecked(false);
        task.setTimestamp(LocalDateTime.of(2026, 4, 10, 8, 0));
        task.setRepeatEvery("Weekly");
        task.setRepeatUntil(LocalDateTime.of(2026, 12, 31, 0, 0));
        task.setUsers(List.of(user));

        Task saved = taskRepository.save(task);
        entityManager.flush();
        entityManager.clear();

        Task found = taskRepository.findById(saved.getId()).orElseThrow();

        assertThat(found.getName()).isEqualTo("Buy groceries");
        assertThat(found.getDescription()).isEqualTo("Milk and eggs");
        assertThat(found.getPoints()).isEqualTo(15);
        assertThat(found.getChecked()).isFalse();
        assertThat(found.getRepeatEvery()).isEqualTo("Weekly");
        assertThat(found.getRepeatUntil()).isEqualTo(LocalDateTime.of(2026, 12, 31, 0, 0));
        assertThat(found.getUsers()).extracting(User::getName).containsExactly("Karl");
    }
}