package backend.message;

import backend.message.dto.MessageRequestDto;
import backend.user.User;
import backend.user.UserService;
import org.springframework.security.access.AccessDeniedException;
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

    /** Saves a message from {@code dto.userId()}, who must be a member of the caller's family. */
    public MessageResponseDto saveMessage(MessageRequestDto dto, String callerFamilyEmail) {

        User user = userService.getUserEntityById(dto.userId());
        if (user.getFamily() == null || !user.getFamily().getEmail().equals(callerFamilyEmail)) {
            throw new AccessDeniedException("User " + dto.userId() + " is not in the caller's family");
        }

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