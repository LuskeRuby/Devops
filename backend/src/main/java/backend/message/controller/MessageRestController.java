package backend.message.controller;

import backend.message.dto.MessageResponseDto;
import backend.message.MessageService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageRestController {

    private final MessageService messageService;

    public MessageRestController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public List<MessageResponseDto> getAllMessages(@RequestParam String familyEmail) {
        return messageService.getAllMessages(familyEmail);
    }
}