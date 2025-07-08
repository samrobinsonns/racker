import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import CentralGuestLayout from '@/Layouts/CentralGuestLayout';
import TenantGuestLayout from '@/Layouts/TenantGuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword, tenant }) {
    console.log('Tenant data:', tenant); // Debug log

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Determine if we're on a tenant domain by checking if we have tenant data
    const isTenantDomain = !!tenant;

    // Choose the appropriate layout
    const Layout = isTenantDomain ? TenantGuestLayout : CentralGuestLayout;

    // Get theme configuration based on branding
    const getThemeConfig = () => {
        const branding = tenant?.branding;
        if (!branding) {
            return {
                primary: 'indigo',
                textColor: 'text-indigo-600',
                focusRing: 'focus:ring-indigo-500',
                buttonBg: 'bg-indigo-600',
                buttonHover: 'hover:bg-indigo-500',
                customColor: null
            };
        }

        const hasCustomColor = branding.primaryColor && branding.primaryColor.startsWith('#');
        
        if (hasCustomColor) {
            return {
                primary: 'custom',
                customColor: branding.primaryColor
            };
        }

        const primaryColor = branding.primaryColor || 'emerald';
        return {
            primary: primaryColor,
            textColor: `text-${primaryColor}-600`,
            focusRing: `focus:ring-${primaryColor}-500`,
            buttonBg: `bg-${primaryColor}-600`,
            buttonHover: `hover:bg-${primaryColor}-500`,
            customColor: null
        };
    };

    const themeConfig = getThemeConfig();

    return (
        <Layout tenant={tenant}>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className={`rounded-md text-sm underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                themeConfig.customColor 
                                    ? 'focus:ring-opacity-50'
                                    : themeConfig.textColor + ' ' + themeConfig.focusRing
                            }`}
                            style={themeConfig.customColor ? {
                                color: themeConfig.customColor,
                                '--tw-ring-color': themeConfig.customColor
                            } : undefined}
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton 
                        className={`ms-4 ${
                            themeConfig.customColor 
                                ? ''
                                : `${themeConfig.buttonBg} ${themeConfig.buttonHover} focus:ring-${themeConfig.primary}-500`
                        }`}
                        style={themeConfig.customColor ? {
                            backgroundColor: themeConfig.customColor,
                            '--tw-ring-color': themeConfig.customColor,
                            '--tw-ring-opacity': '0.5'
                        } : undefined}
                        disabled={processing}
                    >
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </Layout>
    );
}
