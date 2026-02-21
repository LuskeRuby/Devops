package backend.message;

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
    public Message handleChat(ChatMessageDto dto) {
        return messageService.saveMessage(dto);
    }
}