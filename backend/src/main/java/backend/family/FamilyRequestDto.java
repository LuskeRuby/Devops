package backend.family;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.lang.NonNull;

public record FamilyRequestDto(
                @NonNull @NotBlank @Email String email,
                @NonNull @NotBlank @Size(min = 8) String password) {
}