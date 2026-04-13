package backend.common.security;

import backend.family.Family;
import backend.family.FamilyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FamilyDetailsServiceTest {

    @Mock
    private FamilyRepository familyRepository;

    @InjectMocks
    private FamilyDetailsService familyDetailsService;

    @Nested
    @DisplayName("loadUserByUsername")
    class LoadUserByUsername {

        @Test
        @DisplayName("returns UserDetails with email and password when family exists")
        void returnsUserDetailsWhenFound() {
            Family family = new Family();
            family.setEmail("test@family.com");
            family.setPassword("$2a$10$hashed");
            when(familyRepository.findById("test@family.com")).thenReturn(Optional.of(family));

            UserDetails result = familyDetailsService.loadUserByUsername("test@family.com");

            assertThat(result.getUsername()).isEqualTo("test@family.com");
            assertThat(result.getPassword()).isEqualTo("$2a$10$hashed");
        }

        @Test
        @DisplayName("throws UsernameNotFoundException when family not found")
        void throwsWhenFamilyNotFound() {
            when(familyRepository.findById("unknown@family.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> familyDetailsService.loadUserByUsername("unknown@family.com"))
                    .isInstanceOf(UsernameNotFoundException.class)
                    .hasMessageContaining("Family not found");
        }

        @Test
        @DisplayName("throws UsernameNotFoundException when email is null")
        void throwsWhenEmailNull() {
            assertThatThrownBy(() -> familyDetailsService.loadUserByUsername(null))
                    .isInstanceOf(UsernameNotFoundException.class)
                    .hasMessageContaining("Email must not be null or empty");
        }

        @Test
        @DisplayName("throws UsernameNotFoundException when email is empty")
        void throwsWhenEmailEmpty() {
            assertThatThrownBy(() -> familyDetailsService.loadUserByUsername(""))
                    .isInstanceOf(UsernameNotFoundException.class)
                    .hasMessageContaining("Email must not be null or empty");
        }
    }
}