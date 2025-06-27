import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import { useState } from 'react';
import { 
    TagIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

export default function Categories({ categories }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
        color: '#4F46E5', // Default indigo color
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editingCategory) {
            put(route('tenant-admin.support-tickets.categories.update', editingCategory.id), {
                onSuccess: () => {
                    setShowCreateModal(false);
                    setEditingCategory(null);
                    reset();
                }
            });
        } else {
            post(route('tenant-admin.support-tickets.categories.store'), {
                onSuccess: () => {
                    setShowCreateModal(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description,
            color: category.color,
        });
        setShowCreateModal(true);
    };

    const handleDelete = (category) => {
        if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            destroy(route('tenant-admin.support-tickets.categories.destroy', category.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-4">
                    <TagIcon className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Support Ticket Categories
                    </h2>
                </div>
            }
        >
            <Head title="Support Ticket Categories" />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-12">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Categories
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage support ticket categories for your organization.
                                </p>
                            </div>
                            <SecondaryButton onClick={() => {
                                reset();
                                setEditingCategory(null);
                                setShowCreateModal(true);
                            }}>
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Category
                            </SecondaryButton>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories?.map((category) => (
                                <div 
                                    key={category.id} 
                                    className="border border-gray-200 rounded-lg p-4 relative group"
                                    style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {category.name}
                                            </h4>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {category.description}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-gray-400 hover:text-gray-500"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="text-xs text-gray-500">
                                            {category.tickets_count || 0} tickets
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={showCreateModal} onClose={() => {
                setShowCreateModal(false);
                setEditingCategory(null);
                reset();
            }}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {editingCategory ? 'Edit Category' : 'Create Category'}
                    </h2>

                    <div className="mt-6">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="description" value="Description" />
                        <TextInput
                            id="description"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="color" value="Color" />
                        <input
                            id="color"
                            type="color"
                            className="mt-1 block w-full h-10 p-1 rounded-md border-gray-300"
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                        />
                        <InputError message={errors.color} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <SecondaryButton onClick={() => {
                            setShowCreateModal(false);
                            setEditingCategory(null);
                            reset();
                        }}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Create Category')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
} 