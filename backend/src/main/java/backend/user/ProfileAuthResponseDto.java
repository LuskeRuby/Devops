package backend.user;

public record ProfileAuthResponseDto(String accessToken, Long userId, String role) {
}
