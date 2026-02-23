package backend.user;

public record UserDto(
    Long id,
    String username,
    String email,
    int totalPoints
) {}
