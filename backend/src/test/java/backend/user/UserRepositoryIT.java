package backend.user;

import backend.support.TestcontainersConfiguration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import backend.family.Family;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;


//Repository integration test with Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class UserRepositoryIT {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findByFamilyEmail returns users belonging to a specific family")
    void findByFamilyEmail_returnsMatchingUsers() {
        //Arrange
        Family family = new Family();
        family.setEmail("test@family.com");
        family.setPassword("hashed-password");
        entityManager.persist(family);

        User user1 = new User();
        user1.setName("Anders");
        user1.setEmail("a@a.com");
        user1.setRole("PARENT");
        user1.setFamily(family);
        entityManager.persist(user1);

        User user2 = new User();
        user2.setName("Svend");
        user2.setEmail("a@a.com");
        user2.setRole("CHILD");
        user2.setFamily(family);
        entityManager.persist(user2);

        //user in a different family
        Family otherFamily = new Family();
        otherFamily.setEmail("other@family.com");
        otherFamily.setPassword("hashed-password");
        entityManager.persist(otherFamily);

        User user3 = new User();
        user3.setName("Ida");
        user3.setEmail("b@b.com");
        user3.setRole("PARENT");
        user3.setFamily(otherFamily);
        entityManager.persist(user3);

        entityManager.flush();

        //Act
        List<User> result = userRepository.findByFamilyEmail("test@family.com");

        //Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(User::getName).containsExactlyInAnyOrder("Anders", "Svend");
    }

    @Test
    @DisplayName("findByFamilyEmail returns empty when no users")
    void findByFamilyEmail_returnsEmptyForNonexistentFamily() {
        List<User> result = userRepository.findByFamilyEmail("nonexistent@family.com");
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("save and retrieve user correctly")
    void saveAndRetrieve_persistsAllFields() {
        //Arrange
        Family family = new Family();
        family.setEmail("p@p.com");
        family.setPassword("hashed");
        entityManager.persist(family);

        User user = new User();
        user.setName("Hans");
        user.setEmail("p@p.com");
        user.setRole("PARENT");
        user.setPincode("1234");
        user.setTotalPoints(50);
        user.setFamily(family);

        //Act
        User saved = userRepository.save(user);
        entityManager.flush();
        entityManager.clear();

        User found = userRepository.findById(saved.getId()).orElseThrow();

        //Assert
        assertThat(found.getName()).isEqualTo("Hans");
        assertThat(found.getPincode()).isEqualTo("1234");
        assertThat(found.getTotalPoints()).isEqualTo(50);
        assertThat(found.getFamily().getEmail()).isEqualTo("p@p.com");
    }
}