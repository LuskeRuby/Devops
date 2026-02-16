package backend.user;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    // Constructor injection (Best practice over @Autowired)
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(Long id) {
        // Here we call the repository. 
        // We also handle the case where the user doesn't exist in the database.
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public UserDto convertToDto(User user) {
        // Convert User entity to UserDto
        return new UserDto(user.getId(), user.getName(), user.getEmail());
    }
}
