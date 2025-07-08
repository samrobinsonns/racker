import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';

export default function Login({ status, canResetPassword, tenant = null }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Get tenant branding if available
    const props = usePage().props;
    const navigationBranding = props.navigationBranding || {};
    const tenantName = navigationBranding.title || tenant?.name || props.stats?.tenant_name || 'Your Organization';
    const brandingLogo = navigationBranding.logo || 'BuildingOffice2Icon';
    const brandingLogoType = navigationBranding.logoType || 'icon';
    const brandingLogoUrl = navigationBranding.logoUrl;
    const brandingColor = navigationBranding.primaryColor || '#22c55e';

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    const renderIcon = (iconName) => {
        if (HeroIcons[iconName]) {
            const Icon = HeroIcons[iconName];
            return <Icon className="h-8 w-8" />;
        }
        return null;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative">
            {/* Background Image with Overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(/images/crm-background.png)',
                }}
            >
                <div className="absolute inset-0 bg-black opacity-40" />
            </div>

            {/* Login Form */}
            <div className="w-full sm:max-w-md px-6 py-8 relative">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl">
                    <div className="text-center mb-8">
                        {/* Logo */}
                        <div className="mb-4 flex justify-center">
                            {brandingLogoType === 'image' && brandingLogoUrl ? (
                                <img
                                    src={brandingLogoUrl}
                                    alt="Logo"
                                    className="h-12 w-12"
                                />
                            ) : (
                                <div
                                    className="h-12 w-12 flex items-center justify-center"
                                    style={{ color: 'white' }}
                                >
                                    {renderIcon(brandingLogo) || <BuildingOffice2Icon className="h-12 w-12" />}
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Welcome to {tenantName}
                        </h2>
                        <p className="text-gray-200">
                            Please sign in to your account
                        </p>
                    </div>

                    <form onSubmit={submit}>
                        {status && (
                            <div className="mb-4 font-medium text-sm text-green-400 bg-green-400/10 p-3 rounded">
                                {status}
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="email" value="Email" className="text-white" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full bg-white/10 border-gray-400/50 text-white placeholder-gray-300"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Password" className="text-white" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full bg-white/10 border-gray-400/50 text-white placeholder-gray-300"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="border-gray-400/50"
                                />
                                <span className="ml-2 text-sm text-gray-200">Remember me</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-gray-200 hover:text-white underline"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        <div className="mt-6">
                            <PrimaryButton
                                className="w-full justify-center py-3"
                                disabled={processing}
                                style={{
                                    backgroundColor: brandingColor,
                                    borderColor: brandingColor,
                                }}
                            >
                                Sign in
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
