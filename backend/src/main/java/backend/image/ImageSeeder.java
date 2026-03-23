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

        //avatars
        String[] avatars = {"avatar1.png", "avatar2.png"};
        Image firstImage = null;

        for (String filename : avatars) {
            ClassPathResource resource = new ClassPathResource("static/seed-images/" + filename);
            byte[] bytes = resource.getInputStream().readAllBytes();

            Image image = new Image();
            image.setImage(bytes);
            image.setType("AVATAR");
            Image saved = imageRepository.save(image);

            if (firstImage == null) firstImage = saved;
        }

        //task
        String[] taskImages = {"task1.png"};
        for (String filename : taskImages) {
            ClassPathResource resource = new ClassPathResource("static/seed-images/" + filename);
            byte[] bytes = resource.getInputStream().readAllBytes();

            Image image = new Image();
            image.setImage(bytes);
            image.setType("TASK");
            imageRepository.save(image);
        }

        //placeholder avatar
        Image defaultImage = firstImage;
        userRepository.findAll().forEach(user -> {
            user.setImage(defaultImage);
            userRepository.save(user);
        });

        System.out.println("Seeded " + avatars.length + " avatars and " + taskImages.length + " task images.");
    }
}