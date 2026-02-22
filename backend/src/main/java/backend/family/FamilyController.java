package backend.family;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody FamilyRequestDto dto) {
        familyService.register(dto);
    }
}