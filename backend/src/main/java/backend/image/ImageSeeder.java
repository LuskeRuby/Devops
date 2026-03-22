package backend.image;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import backend.user.UserRepository;

@Component
public class ImageSeeder implements ApplicationRunner {

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;

    public ImageSeeder(ImageRepository imageRepository, UserRepository userRepository) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (imageRepository.count() > 0) return;

        String[] avatars = {"avatar1.png", "avatar2.png"};
        Image firstImage = null;

        for (String filename : avatars) {
            ClassPathResource resource = new ClassPathResource("static/seed-avatars/" + filename);
            byte[] bytes = resource.getInputStream().readAllBytes();

            Image image = new Image();
            image.setImage(bytes);
            Image saved = imageRepository.save(image);

            if (firstImage == null) firstImage = saved;
        }

        // assign first avatar to all existing users as default
        Image defaultImage = firstImage;
        userRepository.findAll().forEach(user -> {
            user.setImage(defaultImage);
            userRepository.save(user);
        });

        System.out.println("Seeded " + avatars.length + " avatars.");
    }
}