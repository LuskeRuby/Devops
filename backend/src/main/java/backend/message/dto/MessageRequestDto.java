package backend.message.dto;

public record MessageRequestDto(
        Long userId,
        String content,
        String familyEmail
) {}