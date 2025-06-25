import { usePermissions } from '@/Hooks/usePermissions';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';

export default function PermissionButton({ 
    permission = null, 
    permissions = null, 
    requireAll = false,
    variant = 'primary',
    hideWhenNoAccess = true,
    disableWhenNoAccess = false,
    fallback = null,
    children,
    ...props 
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    let hasAccess = true;

    if (permission) {
        hasAccess = hasPermission(permission);
    } else if (permissions) {
        if (requireAll) {
            hasAccess = hasAllPermissions(permissions);
        } else {
            hasAccess = hasAnyPermission(permissions);
        }
    }

    if (!hasAccess) {
        if (hideWhenNoAccess) {
            return fallback;
        }
        
        if (disableWhenNoAccess) {
            props.disabled = true;
        }
    }

    const ButtonComponent = {
        primary: PrimaryButton,
        secondary: SecondaryButton,
        danger: DangerButton
    }[variant] || PrimaryButton;

    return (
        <ButtonComponent {...props}>
            {children}
        </ButtonComponent>
    );
} 