package backend.user;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

  
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(Long id) {
   
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public User addPoints(Long id, int points) {
    
        User user = getUserById(id);
        
        user.setTotalPoints(user.getTotalPoints() + points);
        
        return userRepository.save(user);
    }
}
