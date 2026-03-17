package backend.message.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class MessageRequestDto {

    private Long userId;
    private String content;
    private String familyEmail;
}