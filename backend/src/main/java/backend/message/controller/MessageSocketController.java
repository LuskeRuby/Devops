package backend.message.controller;

import backend.message.dto.MessageRequestDto;
import backend.message.dto.MessageResponseDto;
import backend.message.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class MessageSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageSocketController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat")
    public void handleChat(MessageRequestDto dto) {
        MessageResponseDto response = messageService.saveMessage(dto);
        messagingTemplate.convertAndSend("/topic/messages/" + dto.getFamilyEmail(), response);
    }
}