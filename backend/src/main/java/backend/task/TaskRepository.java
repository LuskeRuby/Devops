package backend.task;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Find tasks by user ID
    List<Task> findByUsers_Id(Long userId);

    // Find tasks by family email
    List<Task> findByUsers_Family_Email(String familyEmail);
}
