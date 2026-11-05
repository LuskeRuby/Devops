package backend.message.controller;

import backend.message.dto.MessageResponseDto;
import backend.message.MessageService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageRestController {

    private final MessageService messageService;

    public MessageRestController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public List<MessageResponseDto> getAllMessages(@RequestParam String familyEmail, Principal principal) {
        if (principal == null || !principal.getName().equals(familyEmail)) {
            throw new AccessDeniedException("Not allowed to read another family's messages");
        }
        return messageService.getAllMessages(familyEmail);
    }
}