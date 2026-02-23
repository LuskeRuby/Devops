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
@CrossOrigin(origins = "http://localhost:4200") 
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
}
