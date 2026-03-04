package backend.task;

import java.util.List;

public class CreateTaskRequest {

    private Task task;
    private List<Long> userIds;

    public Task getTask() {
        return task;
    }

    public List<Long> getUserIds() {
        return userIds;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public void setUserIds(List<Long> userIds) {
        this.userIds = userIds;
    }
}