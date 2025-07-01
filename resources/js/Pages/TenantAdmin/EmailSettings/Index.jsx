import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { 
    EnvelopeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Index({ settings, auth }) {
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        smtp_host: settings?.smtp_host || '',
        smtp_port: settings?.smtp_port || '587',
        smtp_username: settings?.smtp_username || '',
        smtp_password: settings?.smtp_password || '',
        from_email: settings?.from_email || '',
        from_name: settings?.from_name || '',
        use_ssl: settings?.use_ssl ?? true,
        is_active: settings?.is_active ?? false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('tenant-admin.email-settings.store'));
    };

    const testConnection = () => {
        setTestingConnection(true);
        setTestResult(null);

        post(route('tenant-admin.email-settings.test', { settings_id: settings?.id }), {
            preserveScroll: true,
            onSuccess: (response) => {
                setTestResult({
                    success: response.success,
                    message: response.message
                });
            },
            onError: (errors) => {
                setTestResult({
                    success: false,
                    message: 'Failed to test connection'
                });
            },
            onFinish: () => setTestingConnection(false)
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-4">
                    <EnvelopeIcon className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Email Settings
                    </h2>
                </div>
            }
        >
            <Head title="Email Settings" />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-12">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            SMTP Configuration
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Configure your email server settings for sending support ticket notifications.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Connection Status */}
                        {settings && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    {settings.last_test_successful ? (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    ) : settings.last_tested_at ? (
                                        <XCircleIcon className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <div className="h-5 w-5 rounded-full bg-gray-200" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {settings.last_tested_at ? (
                                                settings.last_test_successful ? 
                                                'Connection verified' : 
                                                'Connection failed'
                                            ) : 'Not tested'}
                                        </p>
                                        {settings.last_tested_at && (
                                            <p className="text-xs text-gray-500">
                                                Last tested: {new Date(settings.last_tested_at).toLocaleString()}
                                            </p>
                                        )}
                                        {settings.last_test_error && (
                                            <p className="text-xs text-red-600 mt-1">
                                                Error: {settings.last_test_error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Test Results */}
                        {testResult && (
                            <div className={`rounded-lg p-4 ${
                                testResult.success ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                                <div className="flex items-center space-x-3">
                                    {testResult.success ? (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircleIcon className="h-5 w-5 text-red-500" />
                                    )}
                                    <p className={`text-sm ${
                                        testResult.success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {testResult.message}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SMTP Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2 bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm text-blue-700">
                                    <strong>SendGrid Configuration:</strong> When using SendGrid, make sure to:
                                </div>
                                <ul className="list-disc ml-8 mt-2 text-sm text-blue-700">
                                    <li>Use "apikey" as the SMTP Username</li>
                                    <li>Use your SendGrid API Key as the SMTP Password</li>
                                    <li>Keep SSL/TLS enabled</li>
                                </ul>
                            </div>
                            <div>
                                <InputLabel htmlFor="smtp_host" value="SMTP Host" />
                                <TextInput
                                    id="smtp_host"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.smtp_host}
                                    onChange={(e) => setData('smtp_host', e.target.value)}
                                    required
                                />
                                <InputError message={errors.smtp_host} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="smtp_port" value="SMTP Port" />
                                <TextInput
                                    id="smtp_port"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.smtp_port}
                                    onChange={(e) => setData('smtp_port', e.target.value)}
                                    required
                                />
                                <InputError message={errors.smtp_port} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="smtp_username" value="SMTP Username" />
                                <TextInput
                                    id="smtp_username"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.smtp_username}
                                    onChange={(e) => setData('smtp_username', e.target.value)}
                                    required
                                />
                                <InputError message={errors.smtp_username} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="smtp_password" value="SMTP Password" />
                                <TextInput
                                    id="smtp_password"
                                    type="password"
                                    className="mt-1 block w-full"
                                    value={data.smtp_password}
                                    onChange={(e) => setData('smtp_password', e.target.value)}
                                    required
                                />
                                <InputError message={errors.smtp_password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="from_email" value="From Email" />
                                <TextInput
                                    id="from_email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.from_email}
                                    onChange={(e) => setData('from_email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.from_email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="from_name" value="From Name" />
                                <TextInput
                                    id="from_name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.from_name}
                                    onChange={(e) => setData('from_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.from_name} className="mt-2" />
                            </div>
                        </div>

                        {/* SSL and Active Settings */}
                        <div className="space-y-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                    checked={data.use_ssl}
                                    onChange={(e) => setData('use_ssl', e.target.checked)}
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Use SSL/TLS
                                </span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Set as active configuration
                                </span>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3">
                            {settings?.id && (
                                <SecondaryButton
                                    type="button"
                                    onClick={testConnection}
                                    disabled={testingConnection || processing}
                                >
                                    {testingConnection ? (
                                        <>
                                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        'Test Connection'
                                    )}
                                </SecondaryButton>
                            )}

                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving...' : 'Save Settings'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 