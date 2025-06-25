import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props;
    const user = auth.user;

    /**
     * Check if user has specific permission
     */
    const hasPermission = (permission) => {
        // Central admins have all permissions
        if (user?.is_central_admin) {
            return true;
        }

        // Check if user has the permission in their roles
        if (user?.permissions && Array.isArray(user.permissions)) {
            return user.permissions.includes(permission);
        }

        return false;
    };

    /**
     * Check if user has any of the specified permissions
     */
    const hasAnyPermission = (permissions) => {
        if (!Array.isArray(permissions)) {
            return hasPermission(permissions);
        }

        return permissions.some(permission => hasPermission(permission));
    };

    /**
     * Check if user has all specified permissions
     */
    const hasAllPermissions = (permissions) => {
        if (!Array.isArray(permissions)) {
            return hasPermission(permissions);
        }

        return permissions.every(permission => hasPermission(permission));
    };

    /**
     * Check if user can access admin areas
     */
    const canAccessAdmin = () => {
        return user?.is_central_admin || hasPermission('manage_tenant_users');
    };

    /**
     * Get user's admin level
     */
    const getAdminLevel = () => {
        if (user?.is_central_admin) {
            return 'central';
        }

        if (hasPermission('manage_tenant_users')) {
            return 'tenant_admin';
        }

        if (user?.tenant_id) {
            return 'tenant_user';
        }

        return 'regular';
    };

    /**
     * Get appropriate layout type for user
     */
    const getLayoutType = () => {
        const adminLevel = getAdminLevel();

        switch (adminLevel) {
            case 'central':
                return 'central_admin';
            case 'tenant_admin':
                return 'tenant_admin';
            case 'tenant_user':
                return 'authenticated';
            default:
                return 'guest';
        }
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessAdmin,
        getAdminLevel,
        getLayoutType,
        user,
    };
} 