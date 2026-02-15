package backend.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
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
    
    private Boolean checked;
    
    private LocalDateTime timestamp;
    
    @Column(name = "Repeat_every")
    private String repeatEvery; // e.g., "Daily", "Weekly", "Monthly"
    
    @Column(name = "Repeat_Until")
    private LocalDateTime repeatUntil;

    @ManyToOne
    @JoinColumn(name = "Image_ID")
    private Image image;

    @ManyToMany(mappedBy = "tasks")
    private List<User> users;
}