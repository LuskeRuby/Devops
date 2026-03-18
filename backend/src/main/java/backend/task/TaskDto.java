package backend.task;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class TaskDto {
    private Long id;
    private String name;
    private String description;
    private Integer points;
    private Boolean checked;
    private LocalDateTime timestamp;
    private String repeatEvery;
    private LocalDateTime repeatUntil;
    private Long imageId;
    private List<Long> assignedUserIds;
    private List<String> assignedUserNames;
}