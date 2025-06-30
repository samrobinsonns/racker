import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import InputError from '@/Components/InputError';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import TagSelector from '../Tags/TagSelector';

export default function ContactForm({ contact = null, customFields = [], availableTags = [] }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        first_name: contact?.first_name || '',
        last_name: contact?.last_name || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
        company: contact?.company || '',
        job_title: contact?.job_title || '',
        type: contact?.type || 'customer',
        status: contact?.status || 'active',
        address_line1: contact?.primary_address?.line1 || '',
        address_line2: contact?.primary_address?.line2 || '',
        city: contact?.primary_address?.city || '',
        state: contact?.primary_address?.state || '',
        postal_code: contact?.primary_address?.postal_code || '',
        country: contact?.primary_address?.country || '',
        notes: contact?.notes || '',
        custom_fields: contact?.custom_field_values || {},
        tags: contact?.tags || [],
    });

    useEffect(() => {
        return () => {
            reset();
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();

        if (contact) {
            put(route('contacts.update', contact.id));
        } else {
            post(route('contacts.store'));
        }
    };

    const handleCustomFieldChange = (field, value) => {
        setData('custom_fields', {
            ...data.custom_fields,
            [field.id]: value,
        });
    };

    const handleTagsChange = (selectedTags) => {
        setData('tags', selectedTags);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Input
                                id="first_name"
                                placeholder="First Name"
                                value={data.first_name}
                                onChange={e => setData('first_name', e.target.value)}
                            />
                            <InputError message={errors.first_name} />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="last_name"
                                placeholder="Last Name"
                                value={data.last_name}
                                onChange={e => setData('last_name', e.target.value)}
                            />
                            <InputError message={errors.last_name} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="phone"
                                placeholder="Phone"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                            />
                            <InputError message={errors.phone} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Input
                                id="company"
                                placeholder="Company"
                                value={data.company}
                                onChange={e => setData('company', e.target.value)}
                            />
                            <InputError message={errors.company} />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="job_title"
                                placeholder="Job Title"
                                value={data.job_title}
                                onChange={e => setData('job_title', e.target.value)}
                            />
                            <InputError message={errors.job_title} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Select
                                value={data.type}
                                onValueChange={value => setData('type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="vendor">Vendor</SelectItem>
                                    <SelectItem value="partner">Partner</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.type} />
                        </div>

                        <div className="space-y-2">
                            <Select
                                value={data.status}
                                onValueChange={value => setData('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            id="address_line1"
                            placeholder="Address Line 1"
                            value={data.address_line1}
                            onChange={e => setData('address_line1', e.target.value)}
                        />
                        <InputError message={errors.address_line1} />
                    </div>

                    <div className="space-y-2">
                        <Input
                            id="address_line2"
                            placeholder="Address Line 2"
                            value={data.address_line2}
                            onChange={e => setData('address_line2', e.target.value)}
                        />
                        <InputError message={errors.address_line2} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Input
                                id="city"
                                placeholder="City"
                                value={data.city}
                                onChange={e => setData('city', e.target.value)}
                            />
                            <InputError message={errors.city} />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="state"
                                placeholder="State/Province"
                                value={data.state}
                                onChange={e => setData('state', e.target.value)}
                            />
                            <InputError message={errors.state} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Input
                                id="postal_code"
                                placeholder="Postal Code"
                                value={data.postal_code}
                                onChange={e => setData('postal_code', e.target.value)}
                            />
                            <InputError message={errors.postal_code} />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="country"
                                placeholder="Country"
                                value={data.country}
                                onChange={e => setData('country', e.target.value)}
                            />
                            <InputError message={errors.country} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                    <TagSelector
                        selectedTags={data.tags}
                        availableTags={availableTags}
                        onChange={handleTagsChange}
                    />
                    <InputError message={errors.tags} />
                </CardContent>
            </Card>

            {customFields.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Custom Fields</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customFields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                {field.type === 'text' && (
                                    <Input
                                        placeholder={field.label}
                                        value={data.custom_fields[field.id] || ''}
                                        onChange={e => handleCustomFieldChange(field, e.target.value)}
                                    />
                                )}
                                {field.type === 'textarea' && (
                                    <Textarea
                                        placeholder={field.label}
                                        value={data.custom_fields[field.id] || ''}
                                        onChange={e => handleCustomFieldChange(field, e.target.value)}
                                    />
                                )}
                                {field.type === 'select' && (
                                    <Select
                                        value={data.custom_fields[field.id] || ''}
                                        onValueChange={value => handleCustomFieldChange(field, value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={field.label} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <InputError message={errors[`custom_fields.${field.id}`]} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Textarea
                            id="notes"
                            placeholder="Add any additional notes..."
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            rows={4}
                        />
                        <InputError message={errors.notes} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
                <Button
                    type="submit"
                    disabled={processing}
                >
                    {contact ? 'Update Contact' : 'Create Contact'}
                </Button>
            </div>
        </form>
    );
} 