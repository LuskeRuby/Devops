package backend.task;

import backend.user.User;
import backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private User testUser;
    private Task testTask;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Anders");

        testTask = new Task();
        testTask.setId(1L);
        testTask.setName("Clean room");
        testTask.setDescription("Tidy up");
        testTask.setPoints(10);
        testTask.setChecked(false);
        testTask.setUsers(List.of(testUser));
    }

    @Nested
    @DisplayName("createTask")
    class CreateTask {

        @Test
        @DisplayName("saves task with resolved users and checked=false")
        void savesTaskWithUsersAndFalseChecked() {
            when(userRepository.findAllById(List.of(1L))).thenReturn(List.of(testUser));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
                Task t = inv.getArgument(0);
                t.setId(42L);
                return t;
            });

            Task result = taskService.createTask(testTask, List.of(1L));

            assertThat(result.getId()).isEqualTo(42L);
            assertThat(result.getChecked()).isFalse();
            assertThat(result.getUsers()).containsExactly(testUser);
            verify(taskRepository).save(testTask);
        }

        @Test
        @DisplayName("throws when task is null")
        void throwsWhenTaskIsNull() {
            assertThatThrownBy(() -> taskService.createTask(null, List.of(1L)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Task is required");
        }

        @Test
        @DisplayName("throws when userIds is empty")
        void throwsWhenUserIdsIsEmpty() {
            assertThatThrownBy(() -> taskService.createTask(testTask, List.of()))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("At least one userId is required");
        }

        @Test
        @DisplayName("throws when userIds is null")
        void throwsWhenUserIdsIsNull() {
            assertThatThrownBy(() -> taskService.createTask(testTask, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("At least one userId is required");
        }
    }

    @Nested
    @DisplayName("getTaskById")
    class GetTaskById {

        @Test
        @DisplayName("returns task when found")
        void returnsTask_whenFound() {
            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));

            Task result = taskService.getTaskById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getName()).isEqualTo("Clean room");
        }

        @Test
        @DisplayName("throws when task not found")
        void throws_whenNotFound() {
            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.getTaskById(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Task not found with id: 99");
        }
    }

    @Nested
    @DisplayName("getTasksForUser")
    class GetTasksForUser {

        @Test
        @DisplayName("returns tasks belonging to user")
        void returnsUserTasks() {
            when(taskRepository.findByUsers_Id(1L)).thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForUser(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Clean room");
        }

        @Test
        @DisplayName("returns empty list when user has no tasks")
        void returnsEmptyForUserWithNoTasks() {
            when(taskRepository.findByUsers_Id(99L)).thenReturn(List.of());

            List<Task> result = taskService.getTasksForUser(99L);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getTasksForFamily")
    class GetTasksForFamily {

        @Test
        @DisplayName("returns distinct tasks for family email")
        void returnsFamilyTasks() {
            when(taskRepository.findDistinctByUsers_Family_Email("fam@test.com"))
                    .thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForFamily("fam@test.com");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Clean room");
        }

        @Test
        @DisplayName("returns empty list when family has no tasks")
        void returnsEmptyForFamilyWithNoTasks() {
            when(taskRepository.findDistinctByUsers_Family_Email("empty@fam.com"))
                    .thenReturn(List.of());

            List<Task> result = taskService.getTasksForFamily("empty@fam.com");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("markAsCompleted")
    class MarkAsCompleted {

        @Test
        @DisplayName("sets checked to true and saves")
        void setsCheckedTrueAndSaves() {
            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.markAsCompleted(1L);

            assertThat(result.getChecked()).isTrue();
            verify(taskRepository).save(testTask);
        }

        @Test
        @DisplayName("throws when task not found")
        void throws_whenNotFound() {
            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.markAsCompleted(99L))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("updateTask")
    class UpdateTask {

        @Test
        @DisplayName("updates all fields on existing task")
        void updatesExistingTask() {
            Task updated = new Task();
            updated.setName("Wash dishes");
            updated.setDescription("After dinner");
            updated.setPoints(20);
            updated.setChecked(true);
            updated.setTimestamp(LocalDateTime.of(2026, 4, 10, 9, 0));
            updated.setRepeatEvery("Daily");
            updated.setRepeatUntil(LocalDateTime.of(2026, 5, 1, 0, 0));

            User user2 = new User();
            user2.setId(2L);

            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(user2));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.updateTask(1L, updated, List.of(2L));

            assertThat(result.getName()).isEqualTo("Wash dishes");
            assertThat(result.getDescription()).isEqualTo("After dinner");
            assertThat(result.getPoints()).isEqualTo(20);
            assertThat(result.getChecked()).isTrue();
            assertThat(result.getRepeatEvery()).isEqualTo("Daily");
            assertThat(result.getUsers()).containsExactly(user2);
            verify(taskRepository).save(testTask);
        }

        @Test
        @DisplayName("defaults points to 0 when null")
        void defaultsPointsToZeroWhenNull() {
            Task updated = new Task();
            updated.setName("Feed cat");
            updated.setPoints(null);

            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            when(userRepository.findAllById(List.of(1L))).thenReturn(List.of(testUser));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.updateTask(1L, updated, List.of(1L));

            assertThat(result.getPoints()).isEqualTo(0);
        }

        @Test
        @DisplayName("throws when updated task is null")
        void throws_whenUpdatedTaskIsNull() {
            assertThatThrownBy(() -> taskService.updateTask(1L, null, List.of(1L)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Task payload is required");
        }

        @Test
        @DisplayName("throws when userIds is empty")
        void throws_whenUserIdsIsEmpty() {
            assertThatThrownBy(() -> taskService.updateTask(1L, testTask, List.of()))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("At least one userId is required");
        }

        @Test
        @DisplayName("throws when task not found")
        void throws_whenTaskNotFound() {
            Task updated = new Task();
            updated.setName("Ghost task");

            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.updateTask(99L, updated, List.of(1L)))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Task not found with id: 99");
        }
    }

    @Nested
    @DisplayName("deleteTask")
    class DeleteTask {

        @Test
        @DisplayName("calls deleteById with correct id")
        void callsDeleteById() {
            taskService.deleteTask(1L);

            verify(taskRepository).deleteById(1L);
        }
    }
}