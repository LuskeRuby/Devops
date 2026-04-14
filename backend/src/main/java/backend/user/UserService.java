package backend.user;

import backend.image.Image;
import backend.image.ImageRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;

    public UserService(ImageRepository imageRepository, UserRepository userRepository) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
    }

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getTotalPoints(),
                user.getFamily() != null ? user.getFamily().getEmail() : null,
                user.getImage() != null ? user.getImage().getId() : null
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
        if (user.getImage() == null) {
            imageRepository.findAll().stream().findFirst().ifPresent(user::setImage);
        }
        return toDto(userRepository.save(user));
    }

    public UserResponseDto editUser(Long id, EditUserRequest updatedUserData) {
        User existingUser = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        
            if(updatedUserData.pincode() != null && !updatedUserData.pincode().isEmpty()) {
                existingUser.setPincode(updatedUserData.pincode());
            }

            if(updatedUserData.name() != null) {
                existingUser.setName(updatedUserData.name());
            }

            if(updatedUserData.role() != null) {
                existingUser.setRole(updatedUserData.role());
            }

        return toDto(userRepository.save(existingUser));
    }

    public UserResponseDto addPoints(Long id, int points) {
        User user = getUserEntityById(id);
        user.setTotalPoints(user.getTotalPoints() + points);
        return toDto(userRepository.save(user));
    }

    public UserResponseDto setProfileImage(Long userId, Long imageId) {
        User user = getUserEntityById(userId);
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found: " + imageId));
        user.setImage(image);
        return toDto(userRepository.save(user));
    }

    public List<UserResponseDto> getUsersByFamilyEmail(String familyEmail) {
        return userRepository.findByFamilyEmail(familyEmail).stream().map(this::toDto).toList();
    }

    public boolean validatePin(Long id, String pin) {
        User user = getUserEntityById(id);
        if (user.getPincode() == null) return false;
        return user.getPincode().equals(pin);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}