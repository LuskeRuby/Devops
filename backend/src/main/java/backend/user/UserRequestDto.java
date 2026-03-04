package backend.user;

public record UserRequestDto(
        Long id,
        String username,
        String email) {
}
