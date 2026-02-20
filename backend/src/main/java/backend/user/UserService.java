package backend.user;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

  
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(Long id) {
        //  call the repository. 
        //  also handle the case where the user doesn't exist in the database.
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
   // This method adds points to a user
   // Updates total points after a task is completed
// These are the points a user earns from a task, which will be added 
// to their total points for rewards.
    public User addPoints(Long id, int points) {
        
        // 1. Get the current user from the database
        User user = getUserById(id);
        
        // 2. Add the task points to the user's existing total points
        user.setTotalPoints(user.getTotalPoints() + points);
        
        // 3. Save the updated total points back into the database
        return userRepository.save(user);
    }
}
