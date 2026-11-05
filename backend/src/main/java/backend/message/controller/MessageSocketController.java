package backend.message.controller;

import backend.message.dto.MessageRequestDto;
import backend.message.dto.MessageResponseDto;
import backend.message.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class MessageSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageSocketController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat")
    public void handleChat(MessageRequestDto dto, Principal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        // The family is the one in the JWT (Principal name), never the one the client claims: the
        // familyEmail in the payload is ignored, and the sender must belong to that family.
        String familyEmail = principal.getName();
        MessageResponseDto response = messageService.saveMessage(dto, familyEmail);
        // One path segment after /topic/ ("messages.<email>", not "messages/<email>"): RabbitMQ's STOMP
        // plugin rejects a topic name that contains a slash ("Invalid destination"). Clients subscribe
        // to the same name (frontend web-socket.service.ts).
        messagingTemplate.convertAndSend("/topic/messages." + familyEmail, response);
    }
}