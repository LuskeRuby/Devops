package backend.message;

import backend.message.dto.MessageRequestDto;
import backend.user.User;
import backend.user.UserService;
import org.springframework.stereotype.Service;
import backend.message.dto.MessageResponseDto;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserService userService;

    public MessageService(MessageRepository messageRepository,
                          UserService userService) {
        this.messageRepository = messageRepository;
        this.userService = userService;
    }

    public MessageResponseDto saveMessage(MessageRequestDto dto) {

        User user = userService.getUserEntityById(dto.userId());

        Message message = new Message();
        message.setUser(user);
        message.setContent(dto.content());
        message.setTimestamp(LocalDateTime.now());

        Message saved = messageRepository.save(message);
        return new MessageResponseDto(saved);
    }

    public List<MessageResponseDto> getAllMessages(String familyEmail) {
        return messageRepository
                .findAllByUser_Family_EmailOrderByTimestampAsc(familyEmail)
                .stream()
                .map(MessageResponseDto::new)
                .collect(Collectors.toList());
    }
}