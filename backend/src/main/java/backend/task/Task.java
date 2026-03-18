package backend.task;

import java.time.LocalDateTime;
import java.util.List;

import backend.image.Image;
import backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter 
@Setter 
@NoArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private Integer points;
    
    private Boolean checked;
    
    private LocalDateTime timestamp;
    
    @Column(name = "Repeat_every")
    private String repeatEvery; // e.g., "Daily", "Weekly", "Monthly"
    
    @Column(name = "Repeat_Until")
    private LocalDateTime repeatUntil;

    @ManyToOne
    @JoinColumn(name = "Image_ID")
    private Image image;

    @ManyToMany
    @JoinTable(
            name = "user_task",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> users;
}