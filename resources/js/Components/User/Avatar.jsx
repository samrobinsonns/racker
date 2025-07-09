import { useMemo } from 'react';

export default function Avatar({ user, className = '', size = 'md' }) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-12 h-12 text-base',
        lg: 'w-16 h-16 text-lg',
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const initials = useMemo(() => getInitials(user.name), [user.name]);

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className={`relative ${sizeClasses[size]}`}>
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.name}
                        className={`rounded-full object-cover ${sizeClasses[size]}`}
                    />
                ) : (
                    <div
                        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-600 ${sizeClasses[size]}`}
                    >
                        {initials}
                    </div>
                )}
            </div>
            {size !== 'sm' && (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                        {user.name}
                    </span>
                    {user.roles?.length > 0 && (
                        <span className="text-sm text-gray-500">
                            {user.roles[0].display_name}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
} 