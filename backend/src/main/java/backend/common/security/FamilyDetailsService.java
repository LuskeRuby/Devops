package backend.common.security;

import backend.family.FamilyRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FamilyDetailsService implements UserDetailsService {

    private final FamilyRepository familyRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null || email.isEmpty()) {
            throw new UsernameNotFoundException("Email must not be null or empty");
        }
        return familyRepository.findById(email)
                .map(family -> User.builder()
                        .username(family.getEmail())
                        .password(family.getPassword())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Family not found: " + email));
    }
}