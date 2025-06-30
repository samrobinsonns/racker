import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Input } from '@/Components/ui/input';
import { Progress } from '@/Components/ui/progress';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function ImportExportManager() {
    const [importing, setImporting] = useState(false);
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        file: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData('file', file);
    };

    const handleImport = (e) => {
        e.preventDefault();
        setImporting(true);
        post(route('contact.import'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('file');
                setImporting(false);
            },
            onError: () => {
                setImporting(false);
            },
        });
    };

    const handleExport = () => {
        window.location.href = route('contact.export');
    };

    const handleDownloadTemplate = () => {
        window.location.href = route('contact.import.template');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Import Contacts</CardTitle>
                    <CardDescription>
                        Import your contacts from a CSV file. Download our template to ensure your data is formatted correctly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleImport} className="space-y-4">
                        <div>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={processing}
                            />
                            {errors.file && (
                                <Alert className="mt-2 bg-red-50 border-red-200">
                                    <XCircleIcon className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-600">
                                        {errors.file}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {importing && progress && (
                            <div className="space-y-2">
                                <Progress value={progress.percentage} />
                                <p className="text-sm text-gray-500">
                                    Uploading: {progress.percentage}%
                                </p>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <Button
                                type="submit"
                                disabled={!data.file || processing}
                            >
                                Import Contacts
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadTemplate}
                            >
                                Download Template
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Export Contacts</CardTitle>
                    <CardDescription>
                        Export all your contacts to a CSV file, including their details, tags, and communication preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={processing}
                    >
                        Export All Contacts
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 