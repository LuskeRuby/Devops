package backend.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200") // Allow requests from Angular dev server
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Listens for GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        
        // 1. Controller receives the request and calls the Service
        User user = userService.getUserById(id);
        
        // 2. Controller wraps the result in an HTTP OK response
        return ResponseEntity.ok(user); 
    }


   // POST: Updates points when a task is completed
   @PostMapping("/{id}/add-points/{points}")
    public ResponseEntity<User> addPoints(@PathVariable Long id, @PathVariable int points) {
        User updatedUser = userService.addPoints(id, points);
        return ResponseEntity.ok(updatedUser);
    }
    
}
