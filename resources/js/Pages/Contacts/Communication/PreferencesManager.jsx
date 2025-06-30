import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Label } from '@/Components/ui/label';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function PreferencesManager({ contact, preferences: initialPreferences }) {
    const [showSuccess, setShowSuccess] = useState(false);

    const { data, setData, patch, processing } = useForm({
        email_notifications: initialPreferences?.email_notifications ?? true,
        sms_notifications: initialPreferences?.sms_notifications ?? false,
        marketing_emails: initialPreferences?.marketing_emails ?? true,
        marketing_sms: initialPreferences?.marketing_sms ?? false,
        newsletter_subscription: initialPreferences?.newsletter_subscription ?? true,
        service_updates: initialPreferences?.service_updates ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('contact.preferences.update', contact.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            },
        });
    };

    const handleToggle = (field) => {
        setData(field, !data[field]);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {showSuccess && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                        Communication preferences updated successfully
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Choose how you would like to receive notifications about your tickets and support requests.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email_notifications">Email Notifications</Label>
                            <p className="text-sm text-gray-500">
                                Receive notifications about your tickets via email
                            </p>
                        </div>
                        <Switch
                            id="email_notifications"
                            checked={data.email_notifications}
                            onCheckedChange={() => handleToggle('email_notifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="sms_notifications">SMS Notifications</Label>
                            <p className="text-sm text-gray-500">
                                Receive notifications about your tickets via SMS
                            </p>
                        </div>
                        <Switch
                            id="sms_notifications"
                            checked={data.sms_notifications}
                            onCheckedChange={() => handleToggle('sms_notifications')}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Marketing Preferences</CardTitle>
                    <CardDescription>
                        Control what type of marketing communications you receive from us.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="marketing_emails">Marketing Emails</Label>
                            <p className="text-sm text-gray-500">
                                Receive promotional offers and updates via email
                            </p>
                        </div>
                        <Switch
                            id="marketing_emails"
                            checked={data.marketing_emails}
                            onCheckedChange={() => handleToggle('marketing_emails')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="marketing_sms">Marketing SMS</Label>
                            <p className="text-sm text-gray-500">
                                Receive promotional offers and updates via SMS
                            </p>
                        </div>
                        <Switch
                            id="marketing_sms"
                            checked={data.marketing_sms}
                            onCheckedChange={() => handleToggle('marketing_sms')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="newsletter_subscription">Newsletter Subscription</Label>
                            <p className="text-sm text-gray-500">
                                Receive our monthly newsletter with updates and tips
                            </p>
                        </div>
                        <Switch
                            id="newsletter_subscription"
                            checked={data.newsletter_subscription}
                            onCheckedChange={() => handleToggle('newsletter_subscription')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="service_updates">Service Updates</Label>
                            <p className="text-sm text-gray-500">
                                Receive important updates about our services
                            </p>
                        </div>
                        <Switch
                            id="service_updates"
                            checked={data.service_updates}
                            onCheckedChange={() => handleToggle('service_updates')}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={processing}
                >
                    Save Preferences
                </Button>
            </div>
        </form>
    );
} 