package backend.task;

import backend.image.Image;
import backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    @Mock
    private TaskService taskService;

    @InjectMocks
    private TaskController taskController;

    private User testUser;
    private Task savedTask;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Anders");

        savedTask = new Task();
        savedTask.setId(10L);
        savedTask.setName("Clean room");
        savedTask.setDescription("Tidy up");
        savedTask.setPoints(15);
        savedTask.setChecked(false);
        savedTask.setTimestamp(LocalDateTime.of(2026, 4, 10, 9, 0));
        savedTask.setUsers(List.of(testUser));
    }

    //reateTask

    @Nested
    @DisplayName("createTask")
    class CreateTaskEndpoint {

        @Test
        @DisplayName("creates task with nested payload")
        void createsTaskWithNestedPayload() {
            CreateTaskRequest.TaskPayload payload = new CreateTaskRequest.TaskPayload();
            payload.setName("Clean room");
            payload.setPoints(15);

            CreateTaskRequest request = new CreateTaskRequest();
            request.setTask(payload);
            request.setUserIds(List.of(1L));

            when(taskService.createTask(any(Task.class), eq(List.of(1L)), eq(1L), any()))
                    .thenReturn(savedTask);

            TaskDto result = taskController.createTask(request, 1L);

            assertThat(result.getName()).isEqualTo("Clean room");
            assertThat(result.getPoints()).isEqualTo(15);
        }

        @Test
        @DisplayName("creates task from flat calendar payload")
        void createsTaskFromFlatPayload() {
            CreateTaskRequest request = new CreateTaskRequest();
            request.setTitle("Calendar event");
            request.setDescription("Auto-created");
            request.setStart(LocalDateTime.of(2026, 4, 10, 9, 0));
            request.setUserIds(List.of(1L));

            when(taskService.createTask(any(Task.class), eq(List.of(1L)), eq(1L), any()))
                    .thenReturn(savedTask);

            TaskDto result = taskController.createTask(request, 1L);

            assertThat(result).isNotNull();
            verify(taskService).createTask(any(Task.class), eq(List.of(1L)), eq(1L), any());
        }

        @Test
        @DisplayName("creates separate tasks for each user when separateTasks=true")
        void createsSeparateTasks() {
            CreateTaskRequest.TaskPayload payload = new CreateTaskRequest.TaskPayload();
            payload.setName("Individual chore");
            payload.setPoints(5);

            CreateTaskRequest request = new CreateTaskRequest();
            request.setTask(payload);
            request.setUserIds(List.of(1L, 2L));
            request.setSeparateTasks(true);

            when(taskService.createTask(any(Task.class), eq(List.of(1L)), eq(1L), any()))
                    .thenReturn(savedTask);
            when(taskService.createTask(any(Task.class), eq(List.of(2L)), eq(1L), any()))
                    .thenReturn(savedTask);

            taskController.createTask(request, 1L);

            verify(taskService).createTask(any(Task.class), eq(List.of(1L)), eq(1L), any());
            verify(taskService).createTask(any(Task.class), eq(List.of(2L)), eq(1L), any());
        }

        @Test
        @DisplayName("throws 400 when payload is null")
        void throwsWhenPayloadNull() {
            CreateTaskRequest request = new CreateTaskRequest();
            request.setUserIds(List.of(1L));

            assertThatThrownBy(() -> taskController.createTask(request, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Task payload with a name is required");
        }

        @Test
        @DisplayName("throws 400 when name is blank")
        void throwsWhenNameBlank() {
            CreateTaskRequest.TaskPayload payload = new CreateTaskRequest.TaskPayload();
            payload.setName("   ");

            CreateTaskRequest request = new CreateTaskRequest();
            request.setTask(payload);
            request.setUserIds(List.of(1L));

            assertThatThrownBy(() -> taskController.createTask(request, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Task payload with a name is required");
        }

        @Test
        @DisplayName("throws 400 when userIds is empty")
        void throwsWhenNoUserIds() {
            CreateTaskRequest.TaskPayload payload = new CreateTaskRequest.TaskPayload();
            payload.setName("Valid name");

            CreateTaskRequest request = new CreateTaskRequest();
            request.setTask(payload);
            request.setUserIds(List.of());

            assertThatThrownBy(() -> taskController.createTask(request, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("At least one userId is required");
        }

        @Test
        @DisplayName("defaults points to 0 when null in payload")
        void defaultsPointsToZero() {
            CreateTaskRequest.TaskPayload payload = new CreateTaskRequest.TaskPayload();
            payload.setName("No points task");
            //points is null

            CreateTaskRequest request = new CreateTaskRequest();
            request.setTask(payload);
            request.setUserIds(List.of(1L));

            when(taskService.createTask(any(Task.class), eq(List.of(1L)), eq(1L), any()))
                    .thenAnswer(inv -> {
                        Task t = inv.getArgument(0);
                        assertThat(t.getPoints()).isEqualTo(0);
                        t.setId(10L);
                        t.setUsers(List.of(testUser));
                        return t;
                    });

            taskController.createTask(request, 1L);

            verify(taskService).createTask(any(Task.class), eq(List.of(1L)), eq(1L), any());
        }
    }

    //updateTask

    @Nested
    @DisplayName("updateTask")
    class UpdateTaskEndpoint {

        @Test
        @DisplayName("throws 400 when payload name is missing")
        void throwsWhenPayloadNameMissing() {
            CreateTaskRequest request = new CreateTaskRequest();
            request.setUserIds(List.of(1L));

            assertThatThrownBy(() -> taskController.updateTask(10L, request, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Task payload with a name is required");
        }

        @Test
        @DisplayName("throws 400 when userIds is null")
        void throwsWhenUserIdsNull() {
            CreateTaskRequest.TaskPayload payload = new CreateTaskRequest.TaskPayload();
            payload.setName("Valid");

            CreateTaskRequest request = new CreateTaskRequest();
            request.setTask(payload);
            //userId null

            assertThatThrownBy(() -> taskController.updateTask(10L, request, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("At least one userId is required");
        }

        @Test
        @DisplayName("delegates to service with correct parameters")
        void delegatesToService() {
            CreateTaskRequest.TaskPayload payload = new CreateTaskRequest.TaskPayload();
            payload.setName("Updated name");
            payload.setPoints(25);
            payload.setChecked(true);

            CreateTaskRequest request = new CreateTaskRequest();
            request.setTask(payload);
            request.setUserIds(List.of(1L));

            when(taskService.updateTask(eq(10L), any(Task.class), eq(List.of(1L)), eq(1L), any()))
                    .thenReturn(savedTask);

            TaskDto result = taskController.updateTask(10L, request, 1L);

            assertThat(result).isNotNull();
            verify(taskService).updateTask(eq(10L), any(Task.class), eq(List.of(1L)), eq(1L), any());
        }
    }


    @Nested
    @DisplayName("convertToDto")
    class ConvertToDto {

        @Test
        @DisplayName("maps all task fields to DTO")
        void mapsAllFields() {
            TaskDto dto = TaskController.convertToDto(savedTask);

            assertThat(dto.getId()).isEqualTo(10L);
            assertThat(dto.getName()).isEqualTo("Clean room");
            assertThat(dto.getDescription()).isEqualTo("Tidy up");
            assertThat(dto.getPoints()).isEqualTo(15);
            assertThat(dto.getChecked()).isFalse();
            assertThat(dto.getTimestamp()).isEqualTo(LocalDateTime.of(2026, 4, 10, 9, 0));
            assertThat(dto.getAssignedUserIds()).containsExactly(1L);
            assertThat(dto.getAssignedUserNames()).containsExactly("Anders");
        }

        @Test
        @DisplayName("sets imageId when task has an image")
        void setsImageId() {
            Image image = new Image();
            image.setId(5L);
            savedTask.setImage(image);

            TaskDto dto = TaskController.convertToDto(savedTask);

            assertThat(dto.getImageId()).isEqualTo(5L);
        }

        @Test
        @DisplayName("leaves imageId null when task has no image")
        void leavesImageIdNull() {
            savedTask.setImage(null);

            TaskDto dto = TaskController.convertToDto(savedTask);

            assertThat(dto.getImageId()).isNull();
        }

        @Test
        @DisplayName("handles task with no users")
        void handlesNoUsers() {
            savedTask.setUsers(null);

            TaskDto dto = TaskController.convertToDto(savedTask);

            assertThat(dto.getAssignedUserIds()).isNull();
            assertThat(dto.getAssignedUserNames()).isNull();
        }
    }
}