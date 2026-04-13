package backend.image;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageRepository imageRepository;

    public ImageController(ImageRepository imageRepository) {
        this.imageRepository = imageRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<Long> upload(@RequestParam("file") MultipartFile file) throws IOException {
        Image image = new Image();
        image.setImage(file.getBytes());
        return ResponseEntity.ok(imageRepository.save(image).getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        Image image = imageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image not found: " + id));
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(image.getImage());
    }


    @GetMapping("/avatars/{category}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Long>> getAvatarsByCategory(@PathVariable String category) {
        List<Long> ids = imageRepository.findByCategory(category)
                .stream()
                .map(Image::getId)
                .toList();
        return ResponseEntity.ok(ids);
    }
}