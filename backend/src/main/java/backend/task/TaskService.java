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
        return taskRepository.findByUsers_Family_Email(familyEmail);
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

    @Transactional(readOnly = true)
    public List<Task> getTasksByUserId(Long userId) {
        return taskRepository.findByUsers_Id(userId);
    }
}