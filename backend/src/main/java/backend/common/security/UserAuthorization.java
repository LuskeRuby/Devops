package backend.common.security;

import backend.user.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("userAuthorization")
public class UserAuthorization {
    private final UserRepository userRepository;

    public UserAuthorization(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //Gets the users details and auth
    private UserPrincipal principal() {
        Object current = SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        return current instanceof UserPrincipal userPrincipal ? userPrincipal : null;
    }

    public boolean canAccessUser(Long id) {
        UserPrincipal caller = principal();
        if (caller == null
                || !userRepository.existsByIdAndEmail(id, caller.email())) {
            return false;
        }

        return isParent(caller) || id.equals(caller.userId());
    }

    public boolean canManageUser(Long id) {
        UserPrincipal caller = principal();
        return caller != null
                && isParent(caller)
                && userRepository.existsByIdAndEmail(id, caller.email());
    }

    public boolean canListFamily(String familyEmail) {
        UserPrincipal caller = principal();
        return caller != null
                && caller.email().equalsIgnoreCase(familyEmail)
                && familyEmail != null;
    }

    public boolean canCreateUser() {
        UserPrincipal caller = principal();
        return caller != null
                && (isParent(caller) || caller.userId() == null);
    }

    public boolean canValidatePin(Long id) {
        UserPrincipal caller = principal();
        return caller != null
                && userRepository.existsByIdAndEmail(id, caller.email());
    }

    private boolean isParent(UserPrincipal caller) {
        return "PARENT".equalsIgnoreCase(caller.role());
    }
}