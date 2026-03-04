package backend.task;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/{id}")
    public Task getTaskById(Long id) {
        return taskService.getTaskById(id);
    }

    @GetMapping
    public Task getTaskByUserId(Long userId) {
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
