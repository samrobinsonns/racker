import { usePermissions } from '@/Hooks/usePermissions';

export default function PermissionGate({ 
    permission = null, 
    permissions = null, 
    requireAll = false, 
    fallback = null, 
    children 
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    let hasAccess = false;

    if (permission) {
        // Single permission check
        hasAccess = hasPermission(permission);
    } else if (permissions) {
        // Multiple permissions check
        if (requireAll) {
            hasAccess = hasAllPermissions(permissions);
        } else {
            hasAccess = hasAnyPermission(permissions);
        }
    } else {
        // No permissions specified, show content
        hasAccess = true;
    }

    if (!hasAccess) {
        return fallback;
    }

    return children;
} 