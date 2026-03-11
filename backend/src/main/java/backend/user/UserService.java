package backend.user;

import org.springframework.stereotype.Service;

import backend.task.Task;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;


    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
   
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }


    public User addPoints(Long id, int points) {
    
        User user = getUserById(id);
        
        user.setTotalPoints(user.getTotalPoints() + points);
        
        return userRepository.save(user);
    }
    
    public List<User> getUsersByFamilyEmail(String familyEmail) {
        return userRepository.findByFamilyEmail(familyEmail);
    }

    public boolean validatePin(Long id, String pin) {
        User user = getUserById(id);
        if (user.getPincode() == null) {
            return false;
        }
        return user.getPincode().equals(pin);
    }
}
