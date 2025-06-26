import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import IconPicker from './IconPicker';
import {
    PlusIcon,
    DocumentTextIcon,
    ChartBarIcon,
    TableCellsIcon,
    DocumentPlusIcon,
    TrashIcon,
    EyeIcon,
    CodeBracketIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

const TEMPLATE_TYPES = {
    basic: {
        name: 'Basic Page',
        description: 'Simple page with header and content',
        icon: DocumentTextIcon,
        samples: ['About Us', 'Contact', 'FAQ', 'Documentation']
    },
    dashboard: {
        name: 'Dashboard',
        description: 'Analytics and metrics page',
        icon: ChartBarIcon,
        samples: ['Sales Dashboard', 'Analytics', 'Performance', 'Reports']
    },
    table: {
        name: 'Data Table',
        description: 'Sortable table with filters',
        icon: TableCellsIcon,
        samples: ['Inventory', 'User Directory', 'Product Catalog', 'Orders']
    },
    form: {
        name: 'Form Page',
        description: 'Interactive forms with validation',
        icon: DocumentPlusIcon,
        samples: ['Contact Form', 'Registration', 'Feedback', 'Settings']
    }
};



// Page Form Component
function PageForm({ data, setData, errors, permissions, onSubmit, processing, selectedTemplate, onTemplateSelect, onCancel }) {
    const previewRoute = data.label ? `/tenant/${data.label.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')}` : '';

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Page</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <InputLabel htmlFor="label" value="Page Name *" />
                    <TextInput
                        id="label"
                        type="text"
                        className="mt-1 block w-full"
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                        placeholder="e.g., Inventory Management"
                        autoFocus
                    />
                    <InputError message={errors.label} className="mt-2" />
                    {previewRoute && (
                        <p className="mt-1 text-xs text-gray-500">
                            URL: <code className="bg-gray-100 px-1 rounded">{previewRoute}</code>
                        </p>
                    )}
                </div>

                <div>
                    <InputLabel htmlFor="description" value="Description" />
                    <TextInput
                        id="description"
                        type="text"
                        className="mt-1 block w-full"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Brief description"
                    />
                    <InputError message={errors.description} className="mt-2" />
                </div>
            </div>

            {/* Template Selection */}
            <div>
                <InputLabel value="Page Template" />
                <div className="mt-2 grid grid-cols-2 gap-3">
                    {Object.entries(TEMPLATE_TYPES).map(([key, template]) => {
                        const IconComponent = template.icon;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onTemplateSelect(key)}
                                className={`p-3 border rounded-lg text-left hover:shadow-sm transition-all ${
                                    selectedTemplate === key
                                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <IconComponent className={`h-5 w-5 ${
                                        selectedTemplate === key ? 'text-indigo-600' : 'text-gray-400'
                                    }`} />
                                    <div>
                                        <h4 className="font-medium text-sm">{template.name}</h4>
                                        <p className="text-xs text-gray-500">{template.description}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick Start Samples */}
            {selectedTemplate && TEMPLATE_TYPES[selectedTemplate]?.samples && (
                <div>
                    <InputLabel value="Quick Start (Optional)" />
                    <p className="text-sm text-gray-600 mt-1 mb-2">Click a sample to auto-fill fields:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {TEMPLATE_TYPES[selectedTemplate].samples.map((sample) => (
                            <button
                                key={sample}
                                type="button"
                                onClick={() => {
                                    setData('label', sample);
                                    const descriptions = {
                                        basic: `${sample} information and details`,
                                        dashboard: `View ${sample.toLowerCase()} metrics and analytics`,
                                        table: `Manage and view ${sample.toLowerCase()} data`,
                                        form: `Submit and manage ${sample.toLowerCase()}`
                                    };
                                    setData('description', descriptions[selectedTemplate] || '');
                                }}
                                className="p-2 text-left border rounded text-xs hover:shadow-sm transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            >
                                {sample}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <InputLabel value="Icon" />
                <div className="mt-2">
                    <IconPicker
                        selectedIcon={data.icon}
                        onSelect={(icon) => setData('icon', icon)}
                    />
                </div>
                <InputError message={errors.icon} className="mt-2" />
            </div>

            <div>
                <InputLabel htmlFor="permission_required" value="Access Control" />
                <select
                    id="permission_required"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={data.permission_required}
                    onChange={(e) => setData('permission_required', e.target.value)}
                >
                    <option value="">All authenticated users</option>
                    {Object.entries(permissions).map(([category, perms]) => (
                        <optgroup key={category} label={category}>
                            {Object.entries(perms).map(([permissionKey, permissionData]) => (
                                <option key={permissionKey} value={permissionKey}>
                                    {permissionData.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <InputError message={errors.permission_required} className="mt-2" />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <SecondaryButton type="button" onClick={onCancel} disabled={processing}>
                    Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={processing || !data.label}>
                    {processing ? 'Creating...' : 'Create Page'}
                </PrimaryButton>
            </div>
        </form>
    );
}

// Existing Pages Component
function ExistingPages({ pages, loading, onDelete, onRefresh }) {
    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500">Loading pages...</div>
            </div>
        );
    }

    if (pages.length === 0) {
        return (
            <div className="text-center py-12">
                <CodeBracketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No custom pages</h3>
                <p className="text-gray-500">Create your first custom page to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Your Pages ({pages.length})</h3>
                <button
                    onClick={onRefresh}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    Refresh
                </button>
            </div>
            {pages.map((page) => (
                <div key={page.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="text-gray-400">
                                {(() => {
                                    const IconComponent = TEMPLATE_TYPES[page.template_type]?.icon || DocumentTextIcon;
                                    return <IconComponent className="h-5 w-5" />;
                                })()}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{page.label}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {TEMPLATE_TYPES[page.template_type]?.name || 'Basic'}
                                    </span>
                                    {page.permission_required && (
                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                            Protected
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <SecondaryButton
                                onClick={() => window.open(page.route_name.replace('tenant.', '/tenant/'), '_blank')}
                                className="text-xs px-2 py-1"
                            >
                                <EyeIcon className="h-4 w-4" />
                            </SecondaryButton>
                            <DangerButton
                                onClick={() => onDelete(page.id)}
                                className="text-xs px-2 py-1"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </DangerButton>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function CustomPagesModal({ show, onClose, onSuccess, tenantId }) {
    const [step, setStep] = useState('form'); // form, template, manage
    const [selectedTemplate, setSelectedTemplate] = useState('basic');
    const [selectedSample, setSelectedSample] = useState('');
    const [permissions, setPermissions] = useState({});
    const [existingPages, setExistingPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        label: '',
        icon: 'DocumentTextIcon',
        permission_required: '',
        category: 'custom',
        description: '',
        generate_page: true,
        template_type: 'basic'
    });

    useEffect(() => {
        if (show) {
            // Load permissions for the specific tenant
            const permissionsUrl = tenantId 
                ? `${route('central-admin.navigation.permissions')}?tenant_id=${tenantId}`
                : route('central-admin.navigation.permissions');
                
            fetch(permissionsUrl)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        setPermissions(result.permissions);
                    }
                })
                .catch(error => console.error('Failed to load permissions:', error));

            // Load existing pages if on manage step
            if (step === 'manage') {
                loadExistingPages();
            }
        }
    }, [show, step]);

    const loadExistingPages = async () => {
        setLoadingPages(true);
        try {
            const response = await fetch(route('central-admin.navigation.items.index'));
            const result = await response.json();
            if (result.success) {
                const customItems = Object.values(result.items).flat().filter(item => item.category === 'custom');
                setExistingPages(customItems);
            }
        } catch (error) {
            console.error('Failed to load existing pages:', error);
        } finally {
            setLoadingPages(false);
        }
    };

    const handleTemplateSelect = (templateKey) => {
        setSelectedTemplate(templateKey);
        setData('template_type', templateKey);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post(route('central-admin.navigation.items.store'), {
            onSuccess: () => {
                reset();
                setStep('manage');
                loadExistingPages();
                onSuccess?.();
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
            }
        });
    };

    const handleDeletePage = async (pageId) => {
        if (!confirm('Delete this page? This cannot be undone.')) return;

        try {
            const response = await fetch(route('central-admin.navigation.items.destroy', pageId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
            });

            const result = await response.json();
            if (result.success) {
                loadExistingPages();
                alert('Page deleted successfully!');
            } else {
                alert('Failed to delete page: ' + result.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete page.');
        }
    };

    const handleClose = () => {
        reset();
        setStep('form');
        setSelectedTemplate('basic');
        setSelectedSample('');
        onClose();
    };

    const renderContent = () => {
        switch (step) {
            case 'form':
                return (
                    <PageForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        permissions={permissions}
                        onSubmit={handleSubmit}
                        processing={processing}
                        selectedTemplate={selectedTemplate}
                        onTemplateSelect={handleTemplateSelect}
                        onCancel={handleClose}
                    />
                );
            case 'manage':
                return (
                    <ExistingPages
                        pages={existingPages}
                        loading={loadingPages}
                        onDelete={handleDeletePage}
                        onRefresh={loadExistingPages}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="4xl">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <CodeBracketIcon className="h-6 w-6 text-indigo-600 mr-3" />
                        <h2 className="text-xl font-medium text-gray-900">Custom Pages</h2>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setStep('form')}
                            className={`px-3 py-1 text-sm rounded ${
                                step === 'form' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <PlusIcon className="h-4 w-4 inline mr-1" />
                            Create
                        </button>
                        <button
                            onClick={() => setStep('manage')}
                            className={`px-3 py-1 text-sm rounded ${
                                step === 'manage' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <EyeIcon className="h-4 w-4 inline mr-1" />
                            Manage
                        </button>
                    </div>
                </div>

                {renderContent()}

                {step !== 'form' && (
                    <div className="flex justify-end pt-6 border-t mt-6">
                        <SecondaryButton onClick={handleClose}>
                            Close
                        </SecondaryButton>
                    </div>
                )}
            </div>
        </Modal>
    );
} 