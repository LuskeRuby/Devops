package backend.user;

import java.util.List;

import org.springframework.http.ResponseEntity;
import backend.task.Task;
import backend.task.TaskController;
import backend.task.TaskDto;
import backend.task.TaskService;
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
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/{id}/add-points/{points}")
    public ResponseEntity<UserResponseDto> addPoints(@PathVariable Long id, @PathVariable int points) {
        return ResponseEntity.ok(userService.addPoints(id, points));
    }

    @GetMapping("/family/{familyEmail}")
    public ResponseEntity<List<UserResponseDto>> getUsersByFamily(@PathVariable String familyEmail) {
        return ResponseEntity.ok(userService.getUsersByFamilyEmail(familyEmail));
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<TaskDto>> getTasksByUserId(@PathVariable Long id) {
        List<Task> tasks = taskService.getTasksByUserId(id);
        List<TaskDto> taskDTOs = tasks.stream()
                .map(TaskController::convertToDto)
                .toList();
        return ResponseEntity.ok(taskDTOs);
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @PostMapping("/{id}/validate-pin")
    public ResponseEntity<Boolean> validatePin(@PathVariable Long id, @RequestBody PinValidationRequest request) {
        boolean isValid = userService.validatePin(id, request.pin());
        if (isValid) {
            return ResponseEntity.ok(true);
        } else {
            return ResponseEntity.status(401).body(false);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        System.out.println("Received request to delete user with id: " + id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

}
