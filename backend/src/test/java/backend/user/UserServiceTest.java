package backend.user;

import backend.image.Image;
import backend.image.ImageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ImageRepository imageRepository;

    @Mock
    private backend.common.security.JwtUtil jwtUtil;

    @Mock
    private backend.family.FamilyService familyService;

    @Mock
    private backend.common.security.refreshtoken.RefreshTokenService refreshTokenService;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Anders");
        testUser.setEmail("a@a.com");
        testUser.setRole("PARENT");
        testUser.setTotalPoints(10);
        testUser.setPincode("1234");

        backend.family.Family family = new backend.family.Family();
        family.setEmail("a@a.com");
        testUser.setFamily(family);
    }

    @Nested
    @DisplayName("getUserById")
    class GetUserById {

        @Test
        @DisplayName("return DTO when user exist")
        void returnsDto_whenUserExists() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            UserResponseDto result = userService.getUserById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("Anders");
            assertThat(result.role()).isEqualTo("PARENT");
            assertThat(result.totalPoints()).isEqualTo(10);
        }

        @Test
        @DisplayName("throws error when user not found")
        void throws_whenUserNotFound() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserById(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("validatePin")
    class ValidatePin {

        @Test
        @DisplayName("return profile response when pin match")
        void returnsProfile_whenPinMatches() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(jwtUtil.generateAccessToken(eq("a@a.com"), any())).thenReturn("mock-token");
            when(refreshTokenService.createRefreshToken(any(), any(), any()))
                    .thenReturn(new backend.common.security.refreshtoken.RefreshToken());

            jakarta.servlet.http.HttpServletResponse response = mock(jakarta.servlet.http.HttpServletResponse.class);
            ProfileAuthResponseDto result = userService.validatePin(1L, "1234", response);

            assertThat(result.accessToken()).isEqualTo("mock-token");
            assertThat(result.userId()).isEqualTo(1L);
            assertThat(result.role()).isEqualTo("PARENT");
            verify(familyService).setRefreshTokenCookie(eq(response), any());
        }

        @Test
        @DisplayName("throws error when pin does not match")
        void throws_whenPinDoesNotMatch() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            jakarta.servlet.http.HttpServletResponse response = mock(jakarta.servlet.http.HttpServletResponse.class);
            assertThatThrownBy(() -> userService.validatePin(1L, "0000", response))
                    .isInstanceOf(backend.common.exception.InvalidCredentialsException.class);
        }

        @Test
        @DisplayName("throws error when user has no pin")
        void throws_whenNoPinSet() {
            testUser.setPincode(null);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            jakarta.servlet.http.HttpServletResponse response = mock(jakarta.servlet.http.HttpServletResponse.class);
            assertThatThrownBy(() -> userService.validatePin(1L, "1234", response))
                    .isInstanceOf(backend.common.exception.InvalidCredentialsException.class);
        }
    }

    @Nested
    @DisplayName("addPoints")
    class AddPoints {

        @Test
        @DisplayName("adds points to total and saves")
        void addsPointsToExistingTotal() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UserResponseDto result = userService.addPoints(1L, 25);

            assertThat(result.totalPoints()).isEqualTo(35); // 10 + 25
            verify(userRepository).save(testUser);
        }
    }

    @Nested
    @DisplayName("createUser")
    class CreateUser {

        @Test
        @DisplayName("assigns image when user has no image")
        void assignsDefaultImage_whenNoImageSet() {
            Image defaultImage = new Image();
            defaultImage.setId(1L);
            when(imageRepository.findAll()).thenReturn(List.of(defaultImage));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.createUser(testUser);

            assertThat(testUser.getImage()).isEqualTo(defaultImage);
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("keeps existing image when user already has one")
        void keepsExistingImage_whenAlreadySet() {
            Image existingImage = new Image();
            existingImage.setId(5L);
            testUser.setImage(existingImage);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.createUser(testUser);

            assertThat(testUser.getImage()).isEqualTo(existingImage);
            verify(imageRepository, never()).findAll();
        }
    }

    @Nested
    @DisplayName("setProfileImage")
    class SetProfileImage {

        @Test
        @DisplayName("updates user image and returns DTO")
        void updatesImageAndReturnsDto() {
            Image newImage = new Image();
            newImage.setId(3L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(imageRepository.findById(3L)).thenReturn(Optional.of(newImage));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UserResponseDto result = userService.setProfileImage(1L, 3L);

            assertThat(result.imageId()).isEqualTo(3L);
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("throws when image not found")
        void throws_whenImageNotFound() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(imageRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.setProfileImage(1L, 99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Image not found");
        }
    }
}