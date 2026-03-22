package backend.task;

import backend.user.User;
import backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public Task createTask(Task task, List<Long> userIds) {
        if (task == null) {
            throw new IllegalArgumentException("Task is required");
        }

        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("At least one userId is required");
        }

        List<User> users = userRepository.findAllById(userIds);

        task.setUsers(users);
        task.setChecked(false);

        return taskRepository.save(task);
    }

    public List<Task> getTasksForUser(Long userId) {
        return taskRepository.findByUsers_Id(userId);
    }

    public Task markAsCompleted(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow();

        task.setChecked(true);
        return taskRepository.save(task);
    }

    public List<Task> getTasksForFamily(String familyEmail) {
        return taskRepository.findDistinctByUsers_Family_Email(familyEmail);
    }

    public Task getTaskById(Long id) {
   
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    public Task saveTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long taskId, Task updatedTask, List<Long> userIds) {
        if (updatedTask == null) {
            throw new IllegalArgumentException("Task payload is required");
        }

        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("At least one userId is required");
        }

        Task existing = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + taskId));

        List<User> users = userRepository.findAllById(userIds);

        existing.setName(updatedTask.getName());
        existing.setDescription(updatedTask.getDescription());
        existing.setPoints(updatedTask.getPoints() != null ? updatedTask.getPoints() : 0);
        existing.setTimestamp(updatedTask.getTimestamp());
        existing.setRepeatEvery(updatedTask.getRepeatEvery());
        existing.setRepeatUntil(updatedTask.getRepeatUntil());
        existing.setUsers(users);

        if (updatedTask.getChecked() != null) {
            existing.setChecked(updatedTask.getChecked());
        }

        return taskRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public List<Task> getTasksByUserId(Long userId) {
        return taskRepository.findByUsers_Id(userId);
    }
}