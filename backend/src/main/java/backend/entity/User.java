package backend.entity;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
    @GeneratedValue
    private Long id;
    private String name;
    private String email;
    private String role;
    private String pincode;

    @ManyToOne
    @JoinColumn(name = "Family_Email", referencedColumnName = "Email")
    private Family family;

    @ManyToOne 
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
}