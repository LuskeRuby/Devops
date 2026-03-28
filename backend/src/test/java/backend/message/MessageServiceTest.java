package backend.message;

import backend.family.Family;
import backend.image.Image;
import backend.message.dto.MessageRequestDto;
import backend.message.dto.MessageResponseDto;
import backend.user.User;
import backend.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private MessageService messageService;

    private User testUser;
    private Family testFamily;

    @BeforeEach
    void setUp() {
        testFamily = new Family();
        testFamily.setEmail("t@t.com");

        Image avatar = new Image();
        avatar.setId(1L);

        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Anders");
        testUser.setFamily(testFamily);
        testUser.setImage(avatar);
    }

    @Nested
    @DisplayName("saveMessage")
    class SaveMessage {

        @Test
        @DisplayName("persists user, content, and timestamp")
        void persistsMessageWithCorrectFields() {
            MessageRequestDto request = new MessageRequestDto(1L, "Hej med dig!", "t@t.com");
            when(userService.getUserEntityById(1L)).thenReturn(testUser);
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                Message msg = inv.getArgument(0);
                msg.setId(10L);
                return msg;
            });

            MessageResponseDto result = messageService.saveMessage(request);

            assertThat(result.id()).isEqualTo(10L);
            assertThat(result.content()).isEqualTo("Hej med dig!");
            assertThat(result.username()).isEqualTo("Anders");
            assertThat(result.userId()).isEqualTo(1L);
            assertThat(result.imageId()).isEqualTo(1L);
            assertThat(result.timestamp()).isNotNull();
        }

        @Test
        @DisplayName("sets timestamp at save time, not from the DTO")
        void setsTimestampAtSaveTime() {
            MessageRequestDto request = new MessageRequestDto(1L, "Test", "t@t.com");
            when(userService.getUserEntityById(1L)).thenReturn(testUser);
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> inv.getArgument(0));

            LocalDateTime before = LocalDateTime.now().minusSeconds(1);
            messageService.saveMessage(request);
            LocalDateTime after = LocalDateTime.now().plusSeconds(1);

            ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
            verify(messageRepository).save(captor.capture());
            assertThat(captor.getValue().getTimestamp()).isBetween(before, after);
        }

        @Test
        @DisplayName("handles user with no profile image")
        void handlesUserWithNoImage() {
            testUser.setImage(null);
            MessageRequestDto request = new MessageRequestDto(1L, "No avatar", "t@t.com");
            when(userService.getUserEntityById(1L)).thenReturn(testUser);
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                Message msg = inv.getArgument(0);
                msg.setId(11L);
                return msg;
            });

            MessageResponseDto result = messageService.saveMessage(request);

            assertThat(result.imageId()).isNull();
        }
    }

    @Nested
    @DisplayName("getAllMessages")
    class GetAllMessages {

        @Test
        @DisplayName("returns messages ordered by timestamp for family")
        void returnsMessagesForFamily() {
            Message msg1 = new Message();
            msg1.setId(1L);
            msg1.setContent("First");
            msg1.setTimestamp(LocalDateTime.of(2026, 3, 28, 10, 0));
            msg1.setUser(testUser);

            Message msg2 = new Message();
            msg2.setId(2L);
            msg2.setContent("Second");
            msg2.setTimestamp(LocalDateTime.of(2026, 3, 28, 10, 5));
            msg2.setUser(testUser);

            when(messageRepository.findAllByUser_Family_EmailOrderByTimestampAsc("t@t.com"))
                    .thenReturn(List.of(msg1, msg2));

            List<MessageResponseDto> results = messageService.getAllMessages("t@t.com");

            assertThat(results).hasSize(2);
            assertThat(results.get(0).content()).isEqualTo("First");
            assertThat(results.get(1).content()).isEqualTo("Second");
        }

        @Test
        @DisplayName("returns empty list when no messages exist for family")
        void returnsEmptyForNoMessages() {
            when(messageRepository.findAllByUser_Family_EmailOrderByTimestampAsc("empty@f.com"))
                    .thenReturn(List.of());

            List<MessageResponseDto> results = messageService.getAllMessages("empty@f.com");

            assertThat(results).isEmpty();
        }
    }
}