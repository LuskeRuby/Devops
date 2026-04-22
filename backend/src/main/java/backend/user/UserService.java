package backend.user;

import backend.image.Image;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {

    private final backend.image.ImageRepository imageRepository;
    private final UserRepository userRepository;
    private final backend.common.security.JwtUtil jwtUtil;
    private final backend.family.FamilyService familyService;
    private final backend.common.security.refreshtoken.RefreshTokenService refreshTokenService;

    public UserService(backend.image.ImageRepository imageRepository,
            UserRepository userRepository,
            backend.common.security.JwtUtil jwtUtil,
            backend.family.FamilyService familyService,
            backend.common.security.refreshtoken.RefreshTokenService refreshTokenService) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.familyService = familyService;
        this.refreshTokenService = refreshTokenService;
    }

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getTotalPoints(),
                user.getTargetPoints(),
                user.getFamily() != null ? user.getFamily().getEmail() : null,
                user.getImage() != null ? user.getImage().getId() : null);
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
            imageRepository.findByName("default-avatar.png").ifPresent(user::setImage);
        }
        
        user.setTargetPoints(200); // Hardcoded for now...

        return toDto(userRepository.save(user));
    }

    public UserResponseDto editUser(Long id, EditUserRequest updatedUserData) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (updatedUserData.pincode() != null && !updatedUserData.pincode().isEmpty()) {
            existingUser.setPincode(updatedUserData.pincode());
        }

        if (updatedUserData.name() != null) {
            existingUser.setName(updatedUserData.name());
        }

        if (updatedUserData.role() != null) {
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

    public ProfileAuthResponseDto validatePin(Long id, String pin, jakarta.servlet.http.HttpServletResponse response) {
        User user = getUserEntityById(id);
        if (user.getPincode() == null || !user.getPincode().equals(pin)) {
            throw new backend.common.exception.InvalidCredentialsException();
        }

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());

        backend.common.security.refreshtoken.RefreshToken refreshToken = refreshTokenService
                .createRefreshToken(user.getFamily(), user.getId(), user.getRole());
        familyService.setRefreshTokenCookie(response, refreshToken.getToken());

        String token = jwtUtil.generateAccessToken(user.getFamily().getEmail(), claims);
        return new ProfileAuthResponseDto(token, user.getId(), user.getRole());
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}