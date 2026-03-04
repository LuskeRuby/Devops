package backend.user;

import java.util.List;

import org.springframework.http.ResponseEntity;
import backend.task.Task;
import backend.task.TaskController;
import backend.task.TaskDto;
import backend.task.TaskService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final TaskService taskService;

    public UserController(UserService userService, TaskService taskService) {
        this.userService = userService;
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("Received request to fetch all users");
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {

        User user = userService.getUserById(id);

        return ResponseEntity.ok(user);
    }

    @PostMapping("/{id}/add-points/{points}")
    public ResponseEntity<User> addPoints(@PathVariable Long id, @PathVariable int points) {
        User updatedUser = userService.addPoints(id, points);
        return ResponseEntity.ok(updatedUser);
    }

    // Listens for GET /api/users/family/{familyEmail}
    @GetMapping("/family/{familyEmail}")
    public ResponseEntity<java.util.List<User>> getUsersByFamily(@PathVariable String familyEmail) {

        // 1. Controller receives the request and calls the Service
        java.util.List<User> users = userService.getUsersByFamilyEmail(familyEmail);

        // 2. Controller wraps the result in an HTTP 200 OK response
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<TaskDto>> getTasksByUserId(@PathVariable Long id) {
        List<Task> tasks = taskService.getTasksByUserId(id);
        
        // Change this:
        System.out.println("Fetched " + tasks.size() + " tasks for user " + id); 
        
        List<TaskDto> taskDTOs = tasks.stream()
                                    .map(TaskController::convertToDto)
                                    .toList();
        return ResponseEntity.ok(taskDTOs);
    }  
}
