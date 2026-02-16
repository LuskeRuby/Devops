package backend.family;

import java.util.List;

import backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter 
@Setter 
@NoArgsConstructor
public class Family {

    @Id
    @Column(name = "Email")
    private String email;

    private String password;

    @OneToMany(mappedBy = "family")
    private List<User> users;
}