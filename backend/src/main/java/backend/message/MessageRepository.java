package backend.message;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findAllByUser_Family_EmailOrderByTimestampAsc(String familyEmail);
}