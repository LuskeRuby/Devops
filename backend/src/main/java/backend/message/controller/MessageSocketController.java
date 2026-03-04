package backend.message.controller;

import backend.message.Message;
import backend.message.dto.MessageRequestDto;
import backend.message.dto.MessageResponseDto;
import backend.message.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MessageSocketController {

    private final MessageService messageService;

    public MessageSocketController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public MessageResponseDto handleChat(MessageRequestDto dto) {
        return messageService.saveMessage(dto);
    }
}