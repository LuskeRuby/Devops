package backend.user;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    // Constructor to connect with the repository
    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // CHANGES HERE MIGHT CAUSE TaskControllerTest TO FAIL.
    @Override
    public void run(String... args) throws Exception {
        // Check if the database is empty
        if (userRepository.count() == 0) {
            
            // Create a dummy user for testing rewards
            User testUser = new User();
            testUser.setName("Asma");
            testUser.setEmail("Asma@test.com");
            testUser.setRole("Child");
            
            // Setting 69 points so we can test the 100-point reward milestone
            testUser.setTotalPoints(987);
            
            // Save this dummy user to the database locker
            userRepository.save(testUser);
            
            System.out.println("Backend: Dummy user 'Asma' created with 734 points.");
        }
    }
}