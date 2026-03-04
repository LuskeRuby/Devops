package backend.task;

import java.util.List;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

  
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Task getTaskById(Long id) {
   
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
    }

    public Task saveTask(Task task) {
        return taskRepository.save(task);
    }

    @Transactional(readOnly = true)
    public List<Task> getTasksByUserId(Long userId) {
        return taskRepository.findByUsers_Id(userId);
    }
}