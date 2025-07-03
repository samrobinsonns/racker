import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import { 
    ServerIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    Cog6ToothIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

export default function Index({ settings, statistics }) {
    const [testingConnection, setTestingConnection] = useState(false);
    const [processingEmails, setProcessingEmails] = useState(false);
    const [connectionResult, setConnectionResult] = useState(null);
    const [processingResult, setProcessingResult] = useState(null);
    const [refreshingStats, setRefreshingStats] = useState(false);
    const [currentStats, setCurrentStats] = useState(statistics);

    const form = useForm({
        enabled: settings.enabled,
        imap_host: settings.imap_host,
        imap_port: settings.imap_port,
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        domain: settings.domain,
        processing_interval: settings.processing_interval,
        max_emails_per_batch: settings.max_emails_per_batch,
        spam_filtering: settings.spam_filtering,
        virus_scanning: settings.virus_scanning,
        ssl_enabled: settings.ssl_enabled,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.patch(route('tenant-admin.mail-server.settings.update'), {
            onSuccess: () => {
                // Settings updated successfully
            },
            preserveScroll: true
        });
    };

    const testConnection = async () => {
        setTestingConnection(true);
        setConnectionResult(null);

        try {
            const response = await fetch(route('tenant-admin.mail-server.test-connection'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            const result = await response.json();
            setConnectionResult(result);
        } catch (error) {
            setConnectionResult({
                success: false,
                message: 'Network error: ' + error.message
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const processEmails = async (dryRun = false) => {
        setProcessingEmails(true);
        setProcessingResult(null);

        try {
            const response = await fetch(route('tenant-admin.mail-server.process-emails'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    dry_run: dryRun,
                    limit: 50
                }),
            });

            const result = await response.json();
            setProcessingResult(result);
            
            if (result.success) {
                refreshStatistics();
            }
        } catch (error) {
            setProcessingResult({
                success: false,
                message: 'Network error: ' + error.message
            });
        } finally {
            setProcessingEmails(false);
        }
    };

    const refreshStatistics = async () => {
        setRefreshingStats(true);

        try {
            const response = await fetch(route('tenant-admin.mail-server.statistics'), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            const result = await response.json();
            if (result.success) {
                setCurrentStats(result.data);
            }
        } catch (error) {
            console.error('Failed to refresh statistics:', error);
        } finally {
            setRefreshingStats(false);
        }
    };

    return (
        <TenantAdminLayout>
            <Head title="Mail Server Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center space-x-4 mb-6">
                                <ServerIcon className="h-8 w-8 text-blue-600" />
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Docker Mail Server Settings
                                </h1>
                            </div>

                            {/* Connection Status */}
                            <div className="mb-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <ServerIcon className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Mail Server Status
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {form.data.enabled ? 'Enabled' : 'Disabled'}
                                                </p>
                                            </div>
                                        </div>
                                        <SecondaryButton
                                            onClick={testConnection}
                                            disabled={testingConnection}
                                            className="text-sm"
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
                                    </div>
                                </div>

                                {connectionResult && (
                                    <div className={`mt-3 rounded-lg p-3 ${
                                        connectionResult.success ? 'bg-green-50' : 'bg-red-50'
                                    }`}>
                                        <div className="flex items-center space-x-2">
                                            {connectionResult.success ? (
                                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircleIcon className="h-4 w-4 text-red-500" />
                                            )}
                                            <p className={`text-sm ${
                                                connectionResult.success ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                                {connectionResult.message}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Statistics */}
                            <div className="mb-6">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-medium text-blue-900">
                                            Mail Server Statistics
                                        </h3>
                                        <SecondaryButton
                                            onClick={refreshStatistics}
                                            disabled={refreshingStats}
                                            size="sm"
                                        >
                                            {refreshingStats ? (
                                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Refresh'
                                            )}
                                        </SecondaryButton>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {currentStats.total_emails}
                                            </p>
                                            <p className="text-xs text-blue-700">Emails in Queue</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {currentStats.archived_emails}
                                            </p>
                                            <p className="text-xs text-green-700">Processed</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-purple-600">
                                                {form.data.processing_interval}s
                                            </p>
                                            <p className="text-xs text-purple-700">Check Interval</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-orange-600">
                                                {form.data.max_emails_per_batch}
                                            </p>
                                            <p className="text-xs text-orange-700">Batch Size</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Connection Settings */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <Cog6ToothIcon className="h-5 w-5 mr-2" />
                                            Connection Settings
                                        </h3>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="enabled" value="Enable Mail Server Processing" />
                                        <div className="mt-2">
                                            <Checkbox
                                                name="enabled"
                                                checked={form.data.enabled}
                                                onChange={e => form.setData('enabled', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Enable automatic email processing
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="domain" value="Mail Domain" />
                                        <TextInput
                                            id="domain"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={form.data.domain}
                                            onChange={e => form.setData('domain', e.target.value)}
                                            required
                                        />
                                        <InputError message={form.errors.domain} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="imap_host" value="IMAP Host" />
                                        <TextInput
                                            id="imap_host"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={form.data.imap_host}
                                            onChange={e => form.setData('imap_host', e.target.value)}
                                            required
                                        />
                                        <InputError message={form.errors.imap_host} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="imap_port" value="IMAP Port" />
                                        <TextInput
                                            id="imap_port"
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={form.data.imap_port}
                                            onChange={e => form.setData('imap_port', e.target.value)}
                                            required
                                        />
                                        <InputError message={form.errors.imap_port} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="smtp_host" value="SMTP Host" />
                                        <TextInput
                                            id="smtp_host"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={form.data.smtp_host}
                                            onChange={e => form.setData('smtp_host', e.target.value)}
                                            required
                                        />
                                        <InputError message={form.errors.smtp_host} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="smtp_port" value="SMTP Port" />
                                        <TextInput
                                            id="smtp_port"
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={form.data.smtp_port}
                                            onChange={e => form.setData('smtp_port', e.target.value)}
                                            required
                                        />
                                        <InputError message={form.errors.smtp_port} className="mt-2" />
                                    </div>

                                    {/* Processing Settings */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <ClockIcon className="h-5 w-5 mr-2" />
                                            Processing Settings
                                        </h3>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="processing_interval" value="Processing Interval (seconds)" />
                                        <TextInput
                                            id="processing_interval"
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={form.data.processing_interval}
                                            onChange={e => form.setData('processing_interval', e.target.value)}
                                            required
                                        />
                                        <InputError message={form.errors.processing_interval} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="max_emails_per_batch" value="Max Emails per Batch" />
                                        <TextInput
                                            id="max_emails_per_batch"
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={form.data.max_emails_per_batch}
                                            onChange={e => form.setData('max_emails_per_batch', e.target.value)}
                                            required
                                        />
                                        <InputError message={form.errors.max_emails_per_batch} className="mt-2" />
                                    </div>

                                    {/* Security Settings */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <ShieldCheckIcon className="h-5 w-5 mr-2" />
                                            Security Settings
                                        </h3>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="spam_filtering" value="Spam Filtering" />
                                        <div className="mt-2">
                                            <Checkbox
                                                name="spam_filtering"
                                                checked={form.data.spam_filtering}
                                                onChange={e => form.setData('spam_filtering', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Enable SpamAssassin filtering
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="virus_scanning" value="Virus Scanning" />
                                        <div className="mt-2">
                                            <Checkbox
                                                name="virus_scanning"
                                                checked={form.data.virus_scanning}
                                                onChange={e => form.setData('virus_scanning', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Enable ClamAV virus scanning
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="ssl_enabled" value="SSL/TLS" />
                                        <div className="mt-2">
                                            <Checkbox
                                                name="ssl_enabled"
                                                checked={form.data.ssl_enabled}
                                                onChange={e => form.setData('ssl_enabled', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Enable SSL/TLS encryption
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                    <div className="flex space-x-3">
                                        <SecondaryButton
                                            type="button"
                                            onClick={() => processEmails(true)}
                                            disabled={processingEmails}
                                        >
                                            {processingEmails ? (
                                                <>
                                                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Dry Run'
                                            )}
                                        </SecondaryButton>
                                        <SecondaryButton
                                            type="button"
                                            onClick={() => processEmails(false)}
                                            disabled={processingEmails}
                                        >
                                            {processingEmails ? (
                                                <>
                                                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Process Emails'
                                            )}
                                        </SecondaryButton>
                                    </div>

                                    <PrimaryButton disabled={form.processing}>
                                        {form.processing ? 'Saving...' : 'Save Settings'}
                                    </PrimaryButton>
                                </div>
                            </form>

                            {/* Processing Results */}
                            {processingResult && (
                                <div className={`mt-6 rounded-lg p-4 ${
                                    processingResult.success ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                    <div className="flex items-center space-x-2">
                                        {processingResult.success ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircleIcon className="h-4 w-4 text-red-500" />
                                        )}
                                        <p className={`text-sm ${
                                            processingResult.success ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            {processingResult.message}
                                        </p>
                                    </div>
                                    {processingResult.data && (
                                        <div className="mt-3 text-sm">
                                            <pre className="bg-white p-2 rounded border overflow-auto">
                                                {JSON.stringify(processingResult.data, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TenantAdminLayout>
    );
} 