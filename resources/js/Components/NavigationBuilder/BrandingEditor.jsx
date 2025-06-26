import { useState } from 'react';
import IconPicker from './IconPicker';
import * as HeroIcons from '@heroicons/react/24/outline';

export default function BrandingEditor({ branding, onUpdate, tenantName }) {
    const [showIconPicker, setShowIconPicker] = useState(false);
    
    const handleBrandingUpdate = (updates) => {
        onUpdate({ ...branding, ...updates });
    };

    const renderIcon = (iconName, className = "h-6 w-6") => {
        if (!iconName) return null;
        const IconComponent = HeroIcons[iconName];
        if (!IconComponent) {
            console.warn(`Icon "${iconName}" not found in Heroicons`);
            return null;
        }
        return <IconComponent className={className} />;
    };

    // Convert hex to RGB for inline styles
    const hexToRgb = (hex) => {
        if (!hex) return 'rgb(34, 197, 94)'; // Default emerald-500
        if (hex.startsWith('#')) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result 
                ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
                : 'rgb(34, 197, 94)';
        }
        return hex;
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <HeroIcons.PaintBrushIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Branding Settings
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                    Customize the logo, title, and colors for your navigation
                </p>
            </div>

            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Navigation Title
                </label>
                <input
                    type="text"
                    value={branding.title || ''}
                    onChange={(e) => handleBrandingUpdate({ title: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder={tenantName || "e.g., Company Portal"}
                />
                <p className="mt-1 text-xs text-gray-500">
                    This appears as the main title in the navigation sidebar
                </p>
            </div>

            {/* Subtitle Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle (Optional)
                </label>
                <input
                    type="text"
                    value={branding.subtitle || ''}
                    onChange={(e) => handleBrandingUpdate({ subtitle: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g., Admin Portal, Dashboard"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Small text that appears below the main title
                </p>
            </div>

            {/* Logo Type Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleBrandingUpdate({ logoType: 'icon' })}
                        className={`relative rounded-lg border-2 p-4 text-left transition-colors ${
                            branding.logoType === 'icon'
                                ? 'border-purple-600 bg-purple-50 text-purple-900'
                                : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center">
                            <HeroIcons.SparklesIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Icon</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">Use HeroIcons</p>
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => handleBrandingUpdate({ logoType: 'image' })}
                        className={`relative rounded-lg border-2 p-4 text-left transition-colors ${
                            branding.logoType === 'image'
                                ? 'border-purple-600 bg-purple-50 text-purple-900'
                                : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center">
                            <HeroIcons.PhotoIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Image</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">Custom image URL</p>
                    </button>
                </div>
            </div>

            {/* Icon Picker (when logoType === 'icon') */}
            {branding.logoType === 'icon' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Icon
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        {renderIcon(branding.logo) || <HeroIcons.BuildingOffice2Icon className="h-6 w-6" />}
                        <span className="ml-2">{branding.logo || 'BuildingOffice2Icon'}</span>
                        <HeroIcons.ChevronDownIcon className="h-4 w-4 ml-2" />
                    </button>
                    
                    <IconPicker
                        isOpen={showIconPicker}
                        onClose={() => setShowIconPicker(false)}
                        currentIcon={branding.logo}
                        onSelectIcon={(icon) => {
                            handleBrandingUpdate({ logo: icon });
                        }}
                    />
                </div>
            )}

            {/* Image URL Input (when logoType === 'image') */}
            {branding.logoType === 'image' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo Image URL
                    </label>
                    <input
                        type="url"
                        value={branding.logoUrl || ''}
                        onChange={(e) => handleBrandingUpdate({ logoUrl: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="https://example.com/logo.png"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Image should be square (1:1 ratio) and will be resized to 32x32px
                    </p>
                    
                    {/* Image Preview */}
                    {branding.logoUrl && (
                        <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                            <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                            <img 
                                src={branding.logoUrl} 
                                alt="Logo preview" 
                                className="h-8 w-8 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <div style={{ display: 'none' }} className="text-xs text-red-600">
                                Failed to load image
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* RGB Color Picker */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                </label>
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            value={branding.primaryColor || '#22c55e'}
                            onChange={(e) => handleBrandingUpdate({ primaryColor: e.target.value })}
                            className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                            type="text"
                            value={branding.primaryColor || '#22c55e'}
                            onChange={(e) => handleBrandingUpdate({ primaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm font-mono"
                            placeholder="#22c55e"
                            pattern="^#[0-9A-Fa-f]{6}$"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        Choose any color for your navigation theme. This will be used for icons, text, and accents.
                    </p>
                    
                    {/* Quick Color Presets */}
                    <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Quick presets:</p>
                        <div className="flex space-x-2">
                            {[
                                { name: 'Emerald', color: '#22c55e' },
                                { name: 'Blue', color: '#3b82f6' },
                                { name: 'Purple', color: '#8b5cf6' },
                                { name: 'Rose', color: '#f43f5e' },
                                { name: 'Amber', color: '#f59e0b' },
                                { name: 'Teal', color: '#14b8a6' },
                                { name: 'Orange', color: '#f97316' },
                                { name: 'Indigo', color: '#6366f1' },
                            ].map((preset) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => handleBrandingUpdate({ primaryColor: preset.color })}
                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                        branding.primaryColor === preset.color 
                                            ? 'border-gray-900 shadow-md' 
                                            : 'border-gray-300'
                                    }`}
                                    style={{ backgroundColor: preset.color }}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Preview</h5>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center">
                        {branding.logoType === 'image' && branding.logoUrl ? (
                            <img 
                                src={branding.logoUrl} 
                                alt="Logo" 
                                className="h-8 w-8 mr-2 object-contain" 
                            />
                        ) : (
                            <div 
                                className="h-8 w-8 mr-2 flex items-center justify-center"
                                style={{ color: branding.primaryColor || '#22c55e' }}
                            >
                                {renderIcon(branding.logo, "h-8 w-8") || <HeroIcons.BuildingOffice2Icon className="h-8 w-8" />}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span 
                                className="text-lg font-bold"
                                style={{ color: branding.primaryColor || '#22c55e' }}
                            >
                                {branding.title || tenantName || 'Tenant Portal'}
                            </span>
                            {branding.subtitle && (
                                <span 
                                    className="text-xs opacity-75"
                                    style={{ color: branding.primaryColor || '#22c55e' }}
                                >
                                    {branding.subtitle}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Color Preview Info */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center text-xs text-gray-600">
                        <div 
                            className="w-4 h-4 rounded mr-2 border border-gray-300"
                            style={{ backgroundColor: branding.primaryColor || '#22c55e' }}
                        />
                        <span className="font-medium">Selected Color:</span>
                        <span className="ml-1 font-mono">{branding.primaryColor || '#22c55e'}</span>
                        <span className="ml-2">({hexToRgb(branding.primaryColor || '#22c55e')})</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 