package backend.user;

import java.util.List;

import backend.family.Family;
import backend.image.Image;
import backend.message.Message;
import backend.task.Task;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity

@Table(name = "users") // "user" is a reserved keyword in some databases, so we use "users"
public class User {
    
    @Id
    @GeneratedValue
    private Long id;
    private String name;
    private String email;
    private String role;
    private String pincode;
    private int totalPoints; // Reward points storage

    @ManyToOne
    @JoinColumn(name = "Family_Email", referencedColumnName = "Email")
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "Image_ID")
    private Image image;


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Message> messages;

    @ManyToMany
    @JoinTable(
        name = "user_task",
        joinColumns = @JoinColumn(name = "User_ID"),
        inverseJoinColumns = @JoinColumn(name = "Task_ID")
    )
    private List<Task> tasks;

    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public User() {}
}