package backend.message.dto;

import backend.message.Message;
import java.time.LocalDateTime;

public record MessageResponseDto(
        Long id,
        String content,
        LocalDateTime timestamp,
        String username,
        Long userId,
        Long imageId
) {
    public MessageResponseDto(Message message) {
        this(
                message.getId(),
                message.getContent(),
                message.getTimestamp(),
                message.getUser().getName(),
                message.getUser().getId(),
                message.getUser().getImage() != null ? message.getUser().getImage().getId() : null
        );
    }
}