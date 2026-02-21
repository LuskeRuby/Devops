package backend.message;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class MessageService {

    public Message saveMessage(ChatMessageDto dto) {

        Message message = new Message();
        message.setContent(dto.getContent());
        message.setTimestamp(LocalDateTime.now());

        // TEMP: no user
        message.setUser(null);

        return message;
    }
}