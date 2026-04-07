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

    private User parent;
    private User child;
    private Task testTask;

    @BeforeEach
    void setUp() {
        parent = new User();
        parent.setId(1L);
        parent.setName("Anders");
        parent.setRole("PARENT");
        parent.setTotalPoints(0);

        child = new User();
        child.setId(2L);
        child.setName("Maja");
        child.setRole("CHILD");
        child.setTotalPoints(0);

        testTask = new Task();
        testTask.setId(10L);
        testTask.setName("Clean room");
        testTask.setPoints(20);
        testTask.setChecked(false);
        testTask.setUsers(List.of(child));
    }

    // ─── createTask ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createTask")
    class CreateTask {

        @Test
        @DisplayName("parent can create a task with checked=false")
        void parentCanCreateTask() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
                Task t = inv.getArgument(0);
                t.setId(99L);
                return t;
            });

            Task result = taskService.createTask(testTask, List.of(2L), 1L);

            assertThat(result.getId()).isEqualTo(99L);
            assertThat(result.getChecked()).isFalse();
            assertThat(result.getUsers()).containsExactly(child);
            verify(taskRepository).save(testTask);
        }

        @Test
        @DisplayName("clamps negative points to 0")
        void clampsNegativePoints() {
            testTask.setPoints(-5);
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.createTask(testTask, List.of(2L), 1L);

            assertThat(result.getPoints()).isEqualTo(0);
        }

        @Test
        @DisplayName("throws when requester is a CHILD")
        void childCannotCreateTask() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));

            assertThatThrownBy(() -> taskService.createTask(testTask, List.of(2L), 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only parents");
        }

        @Test
        @DisplayName("throws when requesterId is null")
        void throwsWhenRequesterIdIsNull() {
            assertThatThrownBy(() -> taskService.createTask(testTask, List.of(2L), null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Requester ID is required");
        }

        @Test
        @DisplayName("throws when task is null")
        void throwsWhenTaskIsNull() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));

            assertThatThrownBy(() -> taskService.createTask(null, List.of(2L), 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Task is required");
        }

        @Test
        @DisplayName("throws when userIds is empty")
        void throwsWhenUserIdsEmpty() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));

            assertThatThrownBy(() -> taskService.createTask(testTask, List.of(), 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("At least one userId is required");
        }
    }

    // ─── getTasksForUser ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTasksForUser")
    class GetTasksForUser {

        @Test
        @DisplayName("parent can view any user's tasks")
        void parentCanViewAnyUserTasks() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(taskRepository.findByUsers_Id(2L)).thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForUser(2L, 1L);

            assertThat(result).containsExactly(testTask);
        }

        @Test
        @DisplayName("child can view their own tasks")
        void childCanViewOwnTasks() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));
            when(taskRepository.findByUsers_Id(2L)).thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForUser(2L, 2L);

            assertThat(result).containsExactly(testTask);
        }

        @Test
        @DisplayName("child cannot view another user's tasks")
        void childCannotViewOtherUserTasks() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));

            assertThatThrownBy(() -> taskService.getTasksForUser(3L, 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Access denied");
        }

        @Test
        @DisplayName("returns tasks without access check when no requesterId")
        void returnsTasksWithNoRequesterId() {
            when(taskRepository.findByUsers_Id(2L)).thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForUser(2L, null);

            assertThat(result).containsExactly(testTask);
        }
    }

    // ─── getTasksForFamily ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTasksForFamily")
    class GetTasksForFamily {

        @Test
        @DisplayName("parent sees all family tasks")
        void parentSeesAllFamilyTasks() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(taskRepository.findDistinctByUsers_Family_Email("fam@test.com"))
                    .thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForFamily("fam@test.com", 1L);

            assertThat(result).containsExactly(testTask);
            verify(taskRepository).findDistinctByUsers_Family_Email("fam@test.com");
            verify(taskRepository, never()).findByUsers_Id(any());
        }

        @Test
        @DisplayName("child sees only their own tasks")
        void childSeesOnlyOwnTasks() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));
            when(taskRepository.findByUsers_Id(2L)).thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForFamily("fam@test.com", 2L);

            assertThat(result).containsExactly(testTask);
            verify(taskRepository).findByUsers_Id(2L);
            verify(taskRepository, never()).findDistinctByUsers_Family_Email(any());
        }

        @Test
        @DisplayName("returns all family tasks when no requesterId")
        void returnsAllTasksWithNoRequesterId() {
            when(taskRepository.findDistinctByUsers_Family_Email("fam@test.com"))
                    .thenReturn(List.of(testTask));

            List<Task> result = taskService.getTasksForFamily("fam@test.com", null);

            assertThat(result).containsExactly(testTask);
        }
    }

    // ─── markAsCompleted ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("markAsCompleted")
    class MarkAsCompleted {

        @Test
        @DisplayName("sets checked=true and awards points to assigned users")
        void setsCheckedAndAwardsPoints() {
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.markAsCompleted(10L, 2L);

            assertThat(result.getChecked()).isTrue();
            assertThat(child.getTotalPoints()).isEqualTo(20);
            verify(userRepository).save(child);
        }

        @Test
        @DisplayName("is idempotent — does not re-award points if already completed")
        void doesNotAwardPointsIfAlreadyComplete() {
            testTask.setChecked(true);
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));

            Task result = taskService.markAsCompleted(10L, 2L);

            assertThat(result.getChecked()).isTrue();
            assertThat(child.getTotalPoints()).isEqualTo(0);
            verify(userRepository, never()).save(child);
            verify(taskRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws when requester is not assigned to the task")
        void throwsWhenRequesterNotAssigned() {
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));

            assertThatThrownBy(() -> taskService.markAsCompleted(10L, 1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Access denied");
        }

        @Test
        @DisplayName("does not award points when task has 0 points")
        void doesNotAwardWhenZeroPoints() {
            testTask.setPoints(0);
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            taskService.markAsCompleted(10L, 2L);

            assertThat(child.getTotalPoints()).isEqualTo(0);
            verify(userRepository, never()).save(child);
        }

        @Test
        @DisplayName("throws when task not found")
        void throwsWhenTaskNotFound() {
            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.markAsCompleted(99L, 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Task not found");
        }
    }

    // ─── unmarkAsCompleted ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("unmarkAsCompleted")
    class UnmarkAsCompleted {

        @Test
        @DisplayName("sets checked=false and deducts points from assigned users")
        void setsUncheckedAndDeductsPoints() {
            testTask.setChecked(true);
            child.setTotalPoints(30);
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.unmarkAsCompleted(10L, 2L);

            assertThat(result.getChecked()).isFalse();
            assertThat(child.getTotalPoints()).isEqualTo(10); // 30 - 20
            verify(userRepository).save(child);
        }

        @Test
        @DisplayName("clamps deducted points to 0 — never goes negative")
        void clampsToZero() {
            testTask.setChecked(true);
            child.setTotalPoints(5); // less than task points (20)
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            taskService.unmarkAsCompleted(10L, 2L);

            assertThat(child.getTotalPoints()).isEqualTo(0);
        }

        @Test
        @DisplayName("is idempotent — does nothing if already unchecked")
        void doesNothingIfAlreadyUnchecked() {
            testTask.setChecked(false);
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));

            taskService.unmarkAsCompleted(10L, 2L);

            verify(userRepository, never()).save(child);
            verify(taskRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws when requester is not assigned to the task")
        void throwsWhenRequesterNotAssigned() {
            testTask.setChecked(true);
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));

            assertThatThrownBy(() -> taskService.unmarkAsCompleted(10L, 1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Access denied");
        }
    }

    // ─── updateTask ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateTask")
    class UpdateTask {

        @Test
        @DisplayName("parent can update all task fields")
        void parentCanUpdateTask() {
            Task updated = new Task();
            updated.setName("Wash dishes");
            updated.setDescription("After dinner");
            updated.setPoints(15);
            updated.setChecked(true);
            updated.setTimestamp(LocalDateTime.of(2026, 4, 10, 9, 0));
            updated.setRepeatEvery("Daily");
            updated.setRepeatUntil(LocalDateTime.of(2026, 5, 1, 0, 0));

            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.updateTask(10L, updated, List.of(2L), 1L);

            assertThat(result.getName()).isEqualTo("Wash dishes");
            assertThat(result.getDescription()).isEqualTo("After dinner");
            assertThat(result.getPoints()).isEqualTo(15);
            assertThat(result.getChecked()).isTrue();
            assertThat(result.getRepeatEvery()).isEqualTo("Daily");
            assertThat(result.getUsers()).containsExactly(child);
        }

        @Test
        @DisplayName("clamps negative points to 0 on update")
        void clampsNegativePoints() {
            Task updated = new Task();
            updated.setName("Some task");
            updated.setPoints(-10);

            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));
            when(userRepository.findAllById(List.of(2L))).thenReturn(List.of(child));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            Task result = taskService.updateTask(10L, updated, List.of(2L), 1L);

            assertThat(result.getPoints()).isEqualTo(0);
        }

        @Test
        @DisplayName("child cannot update a task")
        void childCannotUpdateTask() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));

            assertThatThrownBy(() -> taskService.updateTask(10L, testTask, List.of(2L), 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only parents");
        }

        @Test
        @DisplayName("throws when task not found")
        void throwsWhenTaskNotFound() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.updateTask(99L, testTask, List.of(2L), 1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Task not found with id: 99");
        }

        @Test
        @DisplayName("throws when updatedTask is null")
        void throwsWhenUpdatedTaskIsNull() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));

            assertThatThrownBy(() -> taskService.updateTask(10L, null, List.of(2L), 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Task payload is required");
        }

        @Test
        @DisplayName("throws when userIds is empty")
        void throwsWhenUserIdsEmpty() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));

            assertThatThrownBy(() -> taskService.updateTask(10L, testTask, List.of(), 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("At least one userId is required");
        }
    }

    // ─── deleteTask ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteTask")
    class DeleteTask {

        @Test
        @DisplayName("parent can delete a task")
        void parentCanDeleteTask() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(parent));

            taskService.deleteTask(10L, 1L);

            verify(taskRepository).deleteById(10L);
        }

        @Test
        @DisplayName("child cannot delete a task")
        void childCannotDeleteTask() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(child));

            assertThatThrownBy(() -> taskService.deleteTask(10L, 2L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only parents");
        }

        @Test
        @DisplayName("throws when requesterId is null")
        void throwsWhenRequesterIdIsNull() {
            assertThatThrownBy(() -> taskService.deleteTask(10L, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Requester ID is required");
        }
    }

    // ─── getTaskById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTaskById")
    class GetTaskById {

        @Test
        @DisplayName("returns task when found")
        void returnsTask() {
            when(taskRepository.findById(10L)).thenReturn(Optional.of(testTask));

            Task result = taskService.getTaskById(10L);

            assertThat(result.getName()).isEqualTo("Clean room");
        }

        @Test
        @DisplayName("throws when task not found")
        void throwsWhenNotFound() {
            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.getTaskById(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Task not found with id: 99");
        }
    }
}