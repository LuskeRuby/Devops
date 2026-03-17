package backend.user;

public record UserResponseDto(
        Long id,
        String name,
        String email,
        String role,
        int totalPoints,
        String familyEmail
) {}