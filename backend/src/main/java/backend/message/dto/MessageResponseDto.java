package backend.message.DTO;

import backend.message.Message;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MessageResponseDto {

    private final Long id;
    private final String content;
    private final LocalDateTime timestamp;
    private final String username;

    public MessageResponseDto(Message message) {
        this.id = message.getId();
        this.content = message.getContent();
        this.timestamp = message.getTimestamp();
        this.username = message.getUser().getName();
    }
}