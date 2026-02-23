package backend.family;

import jakarta.annotation.security.PermitAll;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import backend.family.dto.FamilyAuthResponseDto;
import backend.family.dto.FamilyLoginDto;
import backend.family.dto.FamilyRequestDto;

@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @PermitAll
    public void register(@Valid @RequestBody FamilyRequestDto dto) {
        familyService.register(dto);
    }

    @PostMapping("/login")
    @PermitAll
    public FamilyAuthResponseDto login(@Valid @RequestBody FamilyLoginDto dto,
            HttpServletResponse response) {
        return familyService.login(dto, response);
    }

    @PostMapping("/refresh")
    @PermitAll
    public FamilyAuthResponseDto refresh(@CookieValue("refreshToken") String refreshToken,
            HttpServletResponse response) {
        return familyService.refresh(refreshToken, response);
    }
}