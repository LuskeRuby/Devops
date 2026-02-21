package backend.message;

import backend.user.User;
import backend.user.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Controller
public class ChatWebSocketController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatWebSocketController(MessageRepository messageRepository,
                                   UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public Message handleChat(ChatMessageDto dto) {

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Message message = new Message();
        message.setUser(user);
        message.setContent(dto.getContent());
        message.setTimestamp(LocalDateTime.now());

        return messageRepository.save(message);
    }

    @GetMapping("/api/messages")
    public List<Message> getAllMessages() {
        return messageRepository.findAll(Sort.by("timestamp"));
    }
}