import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Checkbox } from '@/Components/ui/checkbox';
import InputError from '@/Components/InputError';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ADDRESS_TYPES = [
    { value: 'billing', label: 'Billing' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'other', label: 'Other' },
];

export default function AddressManager({ contact, addresses: initialAddresses }) {
    const [addresses, setAddresses] = useState(initialAddresses);
    const [isAdding, setIsAdding] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        type: 'billing',
        street_1: '',
        street_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_primary: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingAddressId) {
            patch(route('contact.addresses.update', editingAddressId), {
                preserveScroll: true,
                onSuccess: (response) => {
                    setAddresses(addresses.map(addr => 
                        addr.id === editingAddressId ? response.address : addr
                    ));
                    handleCancel();
                },
            });
        } else {
            post(route('contact.addresses.store', contact.id), {
                preserveScroll: true,
                onSuccess: (response) => {
                    setAddresses([...addresses, response.address]);
                    handleCancel();
                },
            });
        }
    };

    const handleEdit = (address) => {
        setEditingAddressId(address.id);
        setData({
            type: address.type,
            street_1: address.street_1,
            street_2: address.street_2,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            is_primary: address.is_primary,
        });
        setIsAdding(true);
    };

    const handleDelete = (addressId) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        destroy(route('contact.addresses.destroy', addressId), {
            preserveScroll: true,
            onSuccess: () => {
                setAddresses(addresses.filter(addr => addr.id !== addressId));
            },
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingAddressId(null);
        reset();
    };

    return (
        <div className="space-y-6">
            {!isAdding && (
                <div className="flex justify-end">
                    <Button onClick={() => setIsAdding(true)}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Address
                    </Button>
                </div>
            )}

            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingAddressId ? 'Edit Address' : 'Add New Address'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                            {ADDRESS_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_primary"
                                            checked={data.is_primary}
                                            onCheckedChange={checked => setData('is_primary', checked)}
                                        />
                                        <label
                                            htmlFor="is_primary"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Set as primary address
                                        </label>
                                    </div>
                                    <InputError message={errors.is_primary} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Input
                                    placeholder="Street Address"
                                    value={data.street_1}
                                    onChange={e => setData('street_1', e.target.value)}
                                />
                                <InputError message={errors.street_1} />
                            </div>

                            <div className="space-y-2">
                                <Input
                                    placeholder="Apartment, suite, etc."
                                    value={data.street_2}
                                    onChange={e => setData('street_2', e.target.value)}
                                />
                                <InputError message={errors.street_2} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="City"
                                        value={data.city}
                                        onChange={e => setData('city', e.target.value)}
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div className="space-y-2">
                                    <Input
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
                                        placeholder="Postal Code"
                                        value={data.postal_code}
                                        onChange={e => setData('postal_code', e.target.value)}
                                    />
                                    <InputError message={errors.postal_code} />
                                </div>

                                <div className="space-y-2">
                                    <Input
                                        placeholder="Country"
                                        value={data.country}
                                        onChange={e => setData('country', e.target.value)}
                                    />
                                    <InputError message={errors.country} />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {editingAddressId ? 'Update Address' : 'Add Address'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {addresses.map((address) => (
                    <Card key={address.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">
                                            {ADDRESS_TYPES.find(t => t.value === address.type)?.label}
                                        </span>
                                        {address.is_primary && (
                                            <span className="text-sm text-blue-600 font-medium">
                                                (Primary)
                                            </span>
                                        )}
                                    </div>
                                    <address className="text-sm text-gray-600 not-italic">
                                        {address.street_1}<br />
                                        {address.street_2 && (
                                            <>{address.street_2}<br /></>
                                        )}
                                        {address.city}, {address.state} {address.postal_code}<br />
                                        {address.country}
                                    </address>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(address)}
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(address.id)}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 