package backend.family.dto;

import org.springframework.lang.NonNull;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record FamilyLoginDto(
        @NonNull @NotBlank @Email String email,
        @NonNull @NotBlank String password) {
}