package backend.message;

import backend.message.controller.MessageRestController;
import backend.message.dto.MessageResponseDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageRestControllerTest {

    @Mock
    private MessageService messageService;

    @InjectMocks
    private MessageRestController controller;

    private static UsernamePasswordAuthenticationToken caller(String email) {
        return new UsernamePasswordAuthenticationToken(email, null, List.of());
    }

    @Test
    @DisplayName("returns the history of the caller's own family")
    void returnsOwnFamilyHistory() {
        List<MessageResponseDto> history = List.of();
        when(messageService.getAllMessages("t@t.com")).thenReturn(history);

        assertThat(controller.getAllMessages("t@t.com", caller("t@t.com"))).isSameAs(history);
    }

    @Test
    @DisplayName("rejects a request for another family's history without querying it")
    void rejectsOtherFamily() {
        assertThatThrownBy(() -> controller.getAllMessages("other@t.com", caller("t@t.com")))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(messageService);
    }

    @Test
    @DisplayName("rejects an unauthenticated request")
    void rejectsUnauthenticated() {
        assertThatThrownBy(() -> controller.getAllMessages("t@t.com", null))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(messageService);
    }
}
