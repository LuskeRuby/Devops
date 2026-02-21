package backend.message.controller;

import backend.message.Message;
import backend.message.DTO.MessageRequestDto;
import backend.message.DTO.MessageResponseDto;
import backend.message.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

//NOTE THIS IS WEVBSOCKET CONTROLLER, NOT RESTCONTROLLER
@Controller
public class MessageSocketController {

    private final MessageService messageService;

    public MessageSocketController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public MessageResponseDto handleChat(MessageRequestDto dto) {
        Message saved = messageService.saveMessage(dto);
        return new MessageResponseDto(saved);
    }
}