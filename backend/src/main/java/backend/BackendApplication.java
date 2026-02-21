package backend;

import backend.user.User;
import backend.user.UserRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	//mockdata for commuincation/msg feature
	@Bean
	CommandLineRunner initUsers(UserRepository userRepository) {
		return args -> {

			if (userRepository.count() == 0) {

				User user1 = new User();
				user1.setName("User1");
				user1.setPincode("1111");
				user1.setRole("USER");

				User user2 = new User();
				user2.setName("User2");
				user2.setPincode("2222");
				user2.setRole("USER");

				userRepository.save(user1);
				userRepository.save(user2);

				System.out.println("Created test users in H2 DB");
			}
		};
	}
}