package backend.message;

public class ChatMessageDto {

    private Long userId;
    private String content;

    public ChatMessageDto() {}

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}

/*
package backend.message;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class ChatMessageDto {

    private Long userId;
    private String content;
}

 */