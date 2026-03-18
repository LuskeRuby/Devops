package backend.task;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.time.LocalDateTime;
import java.util.List;

public class CreateTaskRequest {

    private TaskPayload task;
    private List<Long> userIds;

    // Backward-compatible flat payload fields from calendar quick-create clients.
    @JsonAlias("title")
    private String title;
    @JsonAlias("description")
    private String description;
    @JsonAlias("start")
    private LocalDateTime start;
    @JsonAlias("end")
    private LocalDateTime end;

    public TaskPayload getTask() {
        return task;
    }

    public List<Long> getUserIds() {
        return userIds;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getStart() {
        return start;
    }

    public LocalDateTime getEnd() {
        return end;
    }

    public void setTask(TaskPayload task) {
        this.task = task;
    }

    public void setUserIds(List<Long> userIds) {
        this.userIds = userIds;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setStart(LocalDateTime start) {
        this.start = start;
    }

    public void setEnd(LocalDateTime end) {
        this.end = end;
    }

    public TaskPayload resolveTaskPayload() {
        if (task != null) {
            return task;
        }

        if (title == null && description == null && start == null && end == null) {
            return null;
        }

        TaskPayload payload = new TaskPayload();
        payload.setName(title);
        payload.setDescription(description);
        payload.setTimestamp(start);
        payload.setRepeatUntil(end);
        payload.setPoints(0);
        payload.setChecked(false);
        return payload;
    }

    public static class TaskPayload {
        private String name;
        private String description;
        private Integer points;
        private Boolean checked;
        private LocalDateTime timestamp;
        private String repeatEvery;
        private LocalDateTime repeatUntil;

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public Integer getPoints() {
            return points;
        }

        public Boolean getChecked() {
            return checked;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public String getRepeatEvery() {
            return repeatEvery;
        }

        public LocalDateTime getRepeatUntil() {
            return repeatUntil;
        }

        public void setName(String name) {
            this.name = name;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public void setPoints(Integer points) {
            this.points = points;
        }

        public void setChecked(Boolean checked) {
            this.checked = checked;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public void setRepeatEvery(String repeatEvery) {
            this.repeatEvery = repeatEvery;
        }

        public void setRepeatUntil(LocalDateTime repeatUntil) {
            this.repeatUntil = repeatUntil;
        }
    }
}