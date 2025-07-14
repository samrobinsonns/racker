import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import {
    CalendarIcon,
    ArrowLeftIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

export default function CalendarCreate() {
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        color: selectedColor,
        is_public: false,
    });

    const colors = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#F97316', // Orange
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/calendar');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Create Calendar
                    </h2>
                    <Link
                        href="/calendar"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Calendar
                    </Link>
                </div>
            }
        >
            <Head title="Create Calendar" />

            <div className="py-6">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Calendar Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Calendar Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    placeholder="Enter calendar name"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    placeholder="Optional description"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            {/* Color Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Calendar Color
                                </label>
                                <div className="grid grid-cols-8 gap-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setData('color', color);
                                            }}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                selectedColor === color
                                                    ? 'border-gray-900 scale-110'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {selectedColor === color && (
                                                <CheckIcon className="w-4 h-4 text-white mx-auto" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {errors.color && (
                                    <p className="mt-1 text-sm text-red-600">{errors.color}</p>
                                )}
                            </div>

                            {/* Public Calendar */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={data.is_public}
                                    onChange={(e) => setData('is_public', e.target.checked)}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                                    Make this calendar public within your organization
                                </label>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-3">
                                <Link
                                    href="/calendar"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                                >
                                    {processing ? 'Creating...' : 'Create Calendar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 