package backend.image;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;
import backend.user.UserRepository;
import java.io.InputStream;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ImageSeeder implements ApplicationRunner {

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;

    public ImageSeeder(ImageRepository imageRepository, UserRepository userRepository) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        String[][] categoryMapping = { 
            { "boy", "boys" }, 
            { "girl", "girls" }, 
            { "man", "gents" }, 
            { "women", "women" },
            { "default", "default" } 
        };
        
        for (String[] mapping : categoryMapping) {
            String folder = mapping[0];
            String category = mapping[1];
            Resource[] avatarResources = resolver.getResources("classpath*:static/avatars/" + folder + "/*.png");
            for (Resource resource : avatarResources) {
                seedImage(resource, "AVATAR", category);
            }
        }

        Resource[] taskResources = resolver.getResources("classpath*:static/seed-images/task*.png");
        for (Resource resource : taskResources) {
            seedImage(resource, "TASK", null);
        }


        if (imageRepository.count() > 0) {
            Image defaultImage = imageRepository.findAll().get(0);
            userRepository.findAll().forEach(user -> {
                if (user.getImage() == null) {
                    user.setImage(defaultImage);
                    userRepository.save(user);
                }
            });
        }

        System.out.println("Image seeding completed.");
    }

    private void seedImage(Resource resource, String type, String category) {
        try {
            String filename = resource.getFilename();
            if (filename == null)
                return;

            if (imageRepository.findByName(filename).isPresent()) {
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                Image image = new Image();
                image.setImage(bytes);
                image.setType(type);
                image.setCategory(category);
                image.setName(filename);
                imageRepository.save(image);
                System.out.println("Seeded image: " + filename + " (Type: " + type + ", Category: " + category + ")");
            }
        } catch (Exception e) {
            System.err.println("Failed to seed image " + resource.getFilename() + ": " + e.getMessage());
        }
    }
}
