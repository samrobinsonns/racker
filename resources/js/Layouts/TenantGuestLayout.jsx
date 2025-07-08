import { Link } from '@inertiajs/react';
import * as HeroIcons from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function TenantGuestLayout({ children, tenant }) {
    const [imageError, setImageError] = useState(false);
    
    // Use tenant.branding if it exists, otherwise use default branding
    const branding = tenant?.branding || {
        logo: 'BuildingOffice2Icon',
        logoType: 'icon',
        title: tenant?.name || 'Tenant Portal',
        subtitle: '',
        primaryColor: '#22c55e',
        logoUrl: null
    };

    // Helper to render icon from string name
    const renderIcon = (iconName, className = "h-20 w-20") => {
        if (!iconName) return null;
        const IconComponent = HeroIcons[iconName];
        if (!IconComponent) {
            console.warn(`Icon "${iconName}" not found in Heroicons`);
            return null;
        }
        return <IconComponent className={className} />;
    };

    // Convert hex to RGB for gradient
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result 
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '34, 197, 94';
    };

    // Get theme configuration based on branding
    const getThemeConfig = () => {
        const hasCustomColor = branding.primaryColor && branding.primaryColor.startsWith('#');
        const rgb = hasCustomColor ? hexToRgb(branding.primaryColor) : '34, 197, 94';
        
        return {
            primaryColor: branding.primaryColor || '#22c55e',
            rgb,
            styles: {
                gradient: `linear-gradient(135deg, rgba(${rgb}, 0.5) 0%, rgba(${rgb}, 0.1) 100%)`,
                icon: { color: branding.primaryColor || '#22c55e' },
                title: { color: '#ffffff' }, // Keep title text white
                subtitle: { color: '#ffffff', opacity: 0.8 }, // Keep subtitle text white with some opacity
                card: { 
                    borderColor: `rgba(${rgb}, 0.2)`,
                    boxShadow: `0 4px 6px -1px rgba(${rgb}, 0.1), 0 2px 4px -1px rgba(${rgb}, 0.06)`
                }
            }
        };
    };

    const theme = getThemeConfig();

    // Render logo based on type and error state
    const renderLogo = () => {
        if (branding.logoType === 'image' && branding.logoUrl && !imageError) {
            return (
                <img 
                    src={branding.logoUrl} 
                    alt={branding.title || tenant?.name} 
                    className="h-20 w-auto" 
                    onError={() => setImageError(true)}
                />
            );
        }
        
        return (
            <div style={theme.styles.icon}>
                {renderIcon(branding.logo)}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: theme.styles.gradient }}>
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    {renderLogo()}
                    <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                        {branding.title || tenant?.name || 'Tenant Portal'}
                    </h1>
                    {branding.subtitle && (
                        <p className="mt-2 text-center text-lg text-white opacity-80">
                            {branding.subtitle}
                        </p>
                    )}
                </div>

                <div 
                    className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10"
                    style={theme.styles.card}
                >
                    {children}
                </div>

                <footer className="mt-8 text-center text-sm text-white opacity-80">
                    <p>{branding.title || tenant?.name || 'Tenant Portal'}</p>
                    <p className="mt-1">Secure access to your resources</p>
                </footer>
            </div>
        </div>
    );
} 