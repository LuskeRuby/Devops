package backend.family;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final PasswordEncoder passwordEncoder;

    public void register(FamilyRequestDto dto) {
        if (familyRepository.existsById(dto.email())) {
            throw new RuntimeException("Email already in use");
        }

        Family family = new Family();
        family.setEmail(dto.email());
        family.setPassword(passwordEncoder.encode(dto.password()));

        familyRepository.save(family);
    }
}