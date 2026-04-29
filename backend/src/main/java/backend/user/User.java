package backend.user;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import backend.family.Family;
import backend.image.Image;
import backend.message.Message;
import backend.task.Task;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "users") // "user" is a reserved keyword in some databases, so we use "users"
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String role;
    private String pincode;
    private int totalPoints; // Reward points storage
    private int targetPoints;

    @ManyToOne
    @JoinColumn(name = "family_email", referencedColumnName = "email")
    @JsonIgnoreProperties("users") // Prevent infinite recursion when serializing Family
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "Image_ID")
    private Image image;


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Message> messages;

    @ManyToMany
    @JoinTable(
            name = "user_task",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "task_id")
    )
    @JsonIgnoreProperties("users")
    private List<Task> tasks;
}