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

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public Task createTask(@RequestBody CreateTaskRequest request) {
        return taskService.createTask(request.getTask(), request.getUserIds());
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
        return dto;
    }   
}
