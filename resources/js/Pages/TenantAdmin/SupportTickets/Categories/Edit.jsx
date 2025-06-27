import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

export default function Edit({ category }) {
    const { data, setData, put, processing, errors } = useForm({
        name: category.name,
        description: category.description || '',
        color: category.color,
        is_active: category.is_active,
        sort_order: category.sort_order,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('tenant-admin.support-tickets.categories.update', category));
    };

    return (
        <TenantAdminLayout>
            <Head title="Edit Support Ticket Category" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h2 className="text-lg font-medium text-gray-900">
                                Edit Support Ticket Category
                            </h2>

                            <form onSubmit={submit} className="mt-6 space-y-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Name" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="description" value="Description" />
                                    <textarea
                                        id="description"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="color" value="Color" />
                                    <div className="mt-1 flex items-center gap-x-3">
                                        <input
                                            id="color"
                                            type="color"
                                            className="h-10 w-10 border-0 rounded-md"
                                            value={data.color}
                                            onChange={e => setData('color', e.target.value)}
                                        />
                                        <TextInput
                                            type="text"
                                            className="block w-full"
                                            value={data.color}
                                            onChange={e => setData('color', e.target.value)}
                                        />
                                    </div>
                                    <InputError message={errors.color} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="sort_order" value="Sort Order" />
                                    <TextInput
                                        id="sort_order"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.sort_order}
                                        onChange={e => setData('sort_order', e.target.value)}
                                    />
                                    <InputError message={errors.sort_order} className="mt-2" />
                                </div>

                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <Checkbox
                                            name="is_active"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <InputLabel value="Active" />
                                        <p className="text-gray-500">Make this category available for new tickets.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>Update Category</PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </TenantAdminLayout>
    );
} 