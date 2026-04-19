package backend.common.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

public class SecurityUtils {

    public static UserPrincipal getCurrentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) authentication.getPrincipal();
        }
        return null;
    }

    public static Long getCurrentUserId() {
        UserPrincipal principal = getCurrentPrincipal();
        return principal != null ? principal.userId() : null;
    }

    public static String getCurrentRole() {
        UserPrincipal principal = getCurrentPrincipal();
        return principal != null ? principal.role() : null;
    }

    public static boolean isParent() {
        String role = getCurrentRole();
        return "PARENT".equalsIgnoreCase(role);
    }
}
