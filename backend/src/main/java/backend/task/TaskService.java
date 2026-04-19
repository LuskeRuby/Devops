package backend.task;

import backend.user.User;
import backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import backend.image.Image;
import backend.image.ImageRepository;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ImageRepository imageRepository;

    public TaskService(TaskRepository taskRepository,
            UserRepository userRepository,
            ImageRepository imageRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.imageRepository = imageRepository;
    }

    public List<Task> getTasksForFamily(String familyEmail) {
        Long activeUserId = backend.common.security.SecurityUtils.getCurrentUserId();
        String role = backend.common.security.SecurityUtils.getCurrentRole();

        // If logged in as a specific user, and that user is a CHILD, only show their tasks
        if (activeUserId != null && "CHILD".equalsIgnoreCase(role)) {
            return taskRepository.findByUsers_Id(activeUserId);
        }
        
        // Otherwise (Parent or Family login), show all family tasks
        return taskRepository.findDistinctByUsers_Family_Email(familyEmail);
    }

    private void validateParentRole() {
        if (!backend.common.security.SecurityUtils.isParent()) {
            throw new RuntimeException("Access denied: Only parents can perform this operation");
        }
    }

    public Task createTask(Task task, List<Long> userIds, Long imageId) {
        validateParentRole();
        if (task == null) {
            throw new IllegalArgumentException("Task is required");
        }

        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("At least one userId is required");
        }

        List<User> users = userRepository.findAllById(userIds);

        task.setUsers(users);
        task.setChecked(false);
        if (task.getPoints() != null && task.getPoints() < 0) {
            task.setPoints(0);
        }

        if (imageId != null) {
            Image image = imageRepository.findById(imageId).orElse(null);
            task.setImage(image);
        }

        return taskRepository.save(task);
    }

    public List<Task> getTasksForUser(Long userId) {
        Long activeUserId = backend.common.security.SecurityUtils.getCurrentUserId();
        String role = backend.common.security.SecurityUtils.getCurrentRole();

        if (activeUserId != null) {
            if (!"PARENT".equalsIgnoreCase(role) && !userId.equals(activeUserId)) {
                throw new RuntimeException("Access denied: Children can only view their own tasks");
            }
        }
        return taskRepository.findByUsers_Id(userId);
    }

    @Transactional
    public Task markAsCompleted(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Long activeUserId = backend.common.security.SecurityUtils.getCurrentUserId();
        String role = backend.common.security.SecurityUtils.getCurrentRole();

        if (activeUserId != null) {
            boolean isAssigned = task.getUsers() != null && 
                                 task.getUsers().stream().anyMatch(u -> u.getId().equals(activeUserId));
            
            boolean isParent = "PARENT".equalsIgnoreCase(role);

            if (!isAssigned && !isParent) {
                throw new RuntimeException("Access denied: You must be assigned to this task or be a parent to complete it");
            }
        }

        if (Boolean.TRUE.equals(task.getChecked()))
            return task;

        task.setChecked(true);

        if (task.getUsers() != null && task.getPoints() != null && task.getPoints() > 0) {
            for (User user : task.getUsers()) {
                user.setTotalPoints(user.getTotalPoints() + task.getPoints());
                userRepository.save(user);
            }
        }

        return taskRepository.save(task);
    }

    @Transactional
    public Task unmarkAsCompleted(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Long activeUserId = backend.common.security.SecurityUtils.getCurrentUserId();
        String role = backend.common.security.SecurityUtils.getCurrentRole();

        if (activeUserId != null) {
            boolean isAssigned = task.getUsers() != null && 
                                 task.getUsers().stream().anyMatch(u -> u.getId().equals(activeUserId));

            boolean isParent = "PARENT".equalsIgnoreCase(role);

            if (!isAssigned && !isParent) {
                throw new RuntimeException("Access denied: You must be assigned to this task or be a parent to uncomplete it");
            }
        }

        if (!Boolean.TRUE.equals(task.getChecked()))
            return task;

        task.setChecked(false);

        if (task.getUsers() != null && task.getPoints() != null && task.getPoints() > 0) {
            for (User user : task.getUsers()) {
                user.setTotalPoints(Math.max(0, user.getTotalPoints() - task.getPoints()));
                userRepository.save(user);
            }
        }

        return taskRepository.save(task);
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
    }

    public void deleteTask(Long id) {
        validateParentRole();
        taskRepository.deleteById(id);
    }

    public Task saveTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long taskId, Task updatedTask, List<Long> userIds, Long imageId) {
        validateParentRole();
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
        int points = updatedTask.getPoints() != null ? updatedTask.getPoints() : 0;
        existing.setPoints(Math.max(0, points));
        existing.setTimestamp(updatedTask.getTimestamp());
        existing.setRepeatEvery(updatedTask.getRepeatEvery());
        existing.setRepeatUntil(updatedTask.getRepeatUntil());
        existing.setUsers(users);

        if (updatedTask.getChecked() != null) {
            existing.setChecked(updatedTask.getChecked());
        }

        if (imageId != null) {
            Image image = imageRepository.findById(imageId).orElse(null);
            existing.setImage(image);
        }

        return taskRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public List<Task> getTasksByUserId(Long userId) {
        return getTasksForUser(userId);
    }
}