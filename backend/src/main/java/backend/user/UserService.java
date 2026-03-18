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

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getTotalPoints(),
                user.getFamily() != null ? user.getFamily().getEmail() : null
        );
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    public UserResponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return toDto(user);
    }

    public User getUserEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public UserResponseDto createUser(User user) {
        return toDto(userRepository.save(user));
    }

    public UserResponseDto addPoints(Long id, int points) {
        User user = getUserEntityById(id);
        user.setTotalPoints(user.getTotalPoints() + points);
        return toDto(userRepository.save(user));
    }

    public List<UserResponseDto> getUsersByFamilyEmail(String familyEmail) {
        return userRepository.findByFamilyEmail(familyEmail).stream().map(this::toDto).toList();
    }

    public boolean validatePin(Long id, String pin) {
        User user = getUserEntityById(id);
        if (user.getPincode() == null) {
            return false;
        }
        return user.getPincode().equals(pin);
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
