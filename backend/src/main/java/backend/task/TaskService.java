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

    public List<Task> getTasksForFamily(String familyEmail, Long requesterId) {
        if (requesterId != null) {
            User requester = userRepository.findById(requesterId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + requesterId));
            
            if ("CHILD".equalsIgnoreCase(requester.getRole())) {
                return taskRepository.findByUsers_Id(requesterId);
            }
        }
        return taskRepository.findDistinctByUsers_Family_Email(familyEmail);
    }

    private void validateParentRole(Long requesterId) {
        if (requesterId == null) {
            throw new IllegalArgumentException("Requester ID is required for this operation");
        }
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("User not found: " + requesterId));
        
        if (!"PARENT".equalsIgnoreCase(requester.getRole())) {
            throw new RuntimeException("Access denied: Only parents can perform this operation");
        }
    }

    public Task createTask(Task task, List<Long> userIds, Long requesterId) {
        validateParentRole(requesterId);
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

        return taskRepository.save(task);
    }

    public List<Task> getTasksForUser(Long userId, Long requesterId) {
        if (requesterId != null) {
            User requester = userRepository.findById(requesterId)
                    .orElseThrow(() -> new RuntimeException("Requester not found: " + requesterId));
            if (!requester.getRole().equalsIgnoreCase("PARENT") && !userId.equals(requesterId)) {
                throw new RuntimeException("Access denied: Children can only view their own tasks");
            }
        }
        return taskRepository.findByUsers_Id(userId);
    }

    @Transactional
    public Task markAsCompleted(Long taskId, Long requesterId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (requesterId != null) {
            User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("User not found: " + requesterId));
             
            boolean isAssigned = task.getUsers() != null && 
                                 task.getUsers().stream().anyMatch(u -> u.getId().equals(requesterId));
            
            if (!isAssigned) {
                throw new RuntimeException("Access denied: You can only complete your own tasks");
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
    public Task unmarkAsCompleted(Long taskId, Long requesterId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (requesterId != null) {
            User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("User not found: " + requesterId));
             
            boolean isAssigned = task.getUsers() != null && 
                                 task.getUsers().stream().anyMatch(u -> u.getId().equals(requesterId));

            if (!isAssigned) {
                throw new RuntimeException("Access denied: You can only uncomplete your own tasks");
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

    public void deleteTask(Long id, Long requesterId) {
        validateParentRole(requesterId);
        taskRepository.deleteById(id);
    }

    public Task saveTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long taskId, Task updatedTask, List<Long> userIds, Long requesterId) {
        validateParentRole(requesterId);
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

        return taskRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public List<Task> getTasksByUserId(Long userId, Long requesterId) {
        return getTasksForUser(userId, requesterId);
    }
}