package backend.message;

import backend.message.DTO.MessageRequestDto;
import backend.user.User;
import backend.user.UserService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserService userService;

    public MessageService(MessageRepository messageRepository,
                          UserService userService) {
        this.messageRepository = messageRepository;
        this.userService = userService;
    }

    public Message saveMessage(MessageRequestDto dto) {

        User user = userService.getUserById(dto.getUserId());

        Message message = new Message();
        message.setUser(user);
        message.setContent(dto.getContent());
        message.setTimestamp(LocalDateTime.now());

        return messageRepository.save(message);
    }
}