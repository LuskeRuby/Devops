package backend.task;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public Task createTask(@RequestBody CreateTaskRequest request) {
        CreateTaskRequest.TaskPayload payload = request.resolveTaskPayload();

        if (payload == null || payload.getName() == null || payload.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task payload with a name is required");
        }

        if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one userId is required");
        }

        Task task = new Task();
        task.setName(payload.getName().trim());
        task.setDescription(payload.getDescription());
        task.setPoints(payload.getPoints() != null ? payload.getPoints() : 0);
        task.setChecked(false);
        task.setTimestamp(payload.getTimestamp());
        task.setRepeatEvery(payload.getRepeatEvery());
        task.setRepeatUntil(payload.getRepeatUntil());

        return taskService.createTask(task, request.getUserIds());
    }

    @GetMapping("/user/{userId}")
    public List<Task> getTasksForUser(@PathVariable Long userId) {
        return taskService.getTasksForUser(userId);
    }

    @PutMapping("/{taskId}/complete")
    public Task completeTask(@PathVariable Long taskId) {
        return taskService.markAsCompleted(taskId);
    }

    @GetMapping("/family/{familyEmail}")
    public List<TaskDto> getTasksForFamily(@PathVariable String familyEmail) {
        return taskService.getTasksForFamily(familyEmail).stream()
                .map(TaskController::convertToDto)
                .toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }

    @GetMapping("/{id}")
    public Task getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @GetMapping
    public Task getTaskByUserId(@PathVariable Long userId) {
        return taskService.getTaskById(userId);
    }

    public static TaskDto convertToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setDescription(task.getDescription());
        dto.setPoints(task.getPoints());
        dto.setChecked(task.getChecked());
        dto.setTimestamp(task.getTimestamp());
        dto.setRepeatEvery(task.getRepeatEvery());
        dto.setRepeatUntil(task.getRepeatUntil());
        
        if (task.getImage() != null) {
            dto.setImageId(task.getImage().getId());
        }
        if (task.getUsers() != null) {
            dto.setAssignedUserIds(task.getUsers().stream().map(user -> user.getId()).toList());
            dto.setAssignedUserNames(task.getUsers().stream().map(user -> user.getName()).toList());
        }
        return dto;
    }   
}
