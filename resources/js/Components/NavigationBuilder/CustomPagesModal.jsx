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
    CodeBracketIcon
} from '@heroicons/react/24/outline';

const TEMPLATE_TYPES = {
    basic: {
        name: 'Basic Page',
        description: 'Simple page with header and content area',
        icon: DocumentTextIcon,
        preview: 'Clean layout with customizable content sections',
        samples: [
            'Company Information',
            'About Us',
            'Contact Page',
            'FAQ Section',
            'Documentation'
        ]
    },
    dashboard: {
        name: 'Dashboard',
        description: 'Dashboard layout with metrics and widgets',
        icon: ChartBarIcon,
        preview: 'Stats cards, charts, and key performance indicators',
        samples: [
            'Sales Dashboard',
            'Analytics Overview',
            'Performance Metrics',
            'Project Status',
            'Team Dashboard'
        ]
    },
    table: {
        name: 'Data Table',
        description: 'Page with data table and filters',
        icon: TableCellsIcon,
        preview: 'Sortable table with search, filters, and pagination',
        samples: [
            'Inventory Management',
            'User Directory',
            'Product Catalog',
            'Order History',
            'Document Library'
        ]
    },
    form: {
        name: 'Form Page',
        description: 'Page with form inputs and validation',
        icon: DocumentPlusIcon,
        preview: 'Interactive forms with validation and submission',
        samples: [
            'Contact Form',
            'Registration Form',
            'Feedback Survey',
            'Application Form',
            'Settings Panel'
        ]
    }
};

export default function CustomPagesModal({ show, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('create');
    const [selectedTemplate, setSelectedTemplate] = useState('basic');
    const [selectedSample, setSelectedSample] = useState('');
    const [previewRoute, setPreviewRoute] = useState('');
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

    // Load permissions and existing pages when modal opens
    useEffect(() => {
        if (show) {
            // Load permissions
            if (Object.keys(permissions).length === 0) {
                fetch(route('central-admin.navigation.permissions'))
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            setPermissions(result.permissions);
                        }
                    })
                    .catch(error => {
                        console.error('Failed to load permissions:', error);
                    });
            }

            // Load existing pages
            loadExistingPages();
        }
    }, [show]);

    const loadExistingPages = async () => {
        setLoadingPages(true);
        try {
            const response = await fetch(route('central-admin.navigation.items.index'));
            const result = await response.json();
            if (result.success) {
                // Filter for custom items only
                const customItems = Object.values(result.items).flat().filter(item => item.category === 'custom');
                setExistingPages(customItems);
            }
        } catch (error) {
            console.error('Failed to load existing pages:', error);
        } finally {
            setLoadingPages(false);
        }
    };

    // Update preview route when label changes
    const updatePreviewRoute = (label) => {
        if (label) {
            const routeKey = label.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '_');
            setPreviewRoute(`/tenant/${routeKey}`);
        } else {
            setPreviewRoute('');
        }
    };

    const handleLabelChange = (e) => {
        const newLabel = e.target.value;
        setData('label', newLabel);
        updatePreviewRoute(newLabel);
    };

    const handleTemplateSelect = (templateKey) => {
        setSelectedTemplate(templateKey);
        setData('template_type', templateKey);
        setSelectedSample(''); // Reset sample selection
    };

    const handleSampleSelect = (sample) => {
        setSelectedSample(sample);
        setData('label', sample);
        updatePreviewRoute(sample);
        
        // Auto-set description based on template and sample
        let description = '';
        
        switch (selectedTemplate) {
            case 'basic':
                description = `${sample} information and details`;
                break;
            case 'dashboard':
                description = `View ${sample.toLowerCase()} metrics and analytics`;
                break;
            case 'table':
                description = `Manage and view ${sample.toLowerCase()} data`;
                break;
            case 'form':
                description = `Submit and manage ${sample.toLowerCase()}`;
                break;
        }
        
        setData('description', description);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post(route('central-admin.navigation.items.store'), {
            onSuccess: () => {
                reset();
                setPreviewRoute('');
                setSelectedTemplate('basic');
                setSelectedSample('');
                loadExistingPages(); // Refresh the manage tab
                onSuccess?.();
                // Switch to manage tab to see the created page
                setActiveTab('manage');
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
            }
        });
    };

    const handleDeletePage = async (pageId) => {
        if (!confirm('Are you sure you want to delete this custom page? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(route('central-admin.navigation.items.destroy', pageId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
            });

            const result = await response.json();
            if (result.success) {
                loadExistingPages(); // Refresh the list
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
        setPreviewRoute('');
        setSelectedTemplate('basic');
        setSelectedSample('');
        setActiveTab('create');
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="6xl">
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <div className="flex-shrink-0">
                        <CodeBracketIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h2 className="ml-3 text-lg font-medium text-gray-900">
                        Custom Pages
                    </h2>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'create'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <PlusIcon className="h-4 w-4 inline mr-2" />
                            Create New Page
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'manage'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <EyeIcon className="h-4 w-4 inline mr-2" />
                            Manage Pages ({existingPages.length})
                        </button>
                    </nav>
                </div>

                {/* Create Tab */}
                {activeTab === 'create' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Template Selection */}
                        <div>
                            <InputLabel value="Choose Template Type" />
                            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {Object.entries(TEMPLATE_TYPES).map(([key, template]) => {
                                    const IconComponent = template.icon;
                                    return (
                                        <div
                                            key={key}
                                            className={`relative cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                                                selectedTemplate === key
                                                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                            onClick={() => handleTemplateSelect(key)}
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <IconComponent
                                                    className={`h-8 w-8 mb-3 ${
                                                        selectedTemplate === key
                                                            ? 'text-indigo-600'
                                                            : 'text-gray-400'
                                                    }`}
                                                />
                                                <h4 className={`text-sm font-medium mb-1 ${
                                                    selectedTemplate === key
                                                        ? 'text-indigo-900'
                                                        : 'text-gray-900'
                                                }`}>
                                                    {template.name}
                                                </h4>
                                                <p className={`text-xs mb-2 ${
                                                    selectedTemplate === key
                                                        ? 'text-indigo-700'
                                                        : 'text-gray-500'
                                                }`}>
                                                    {template.description}
                                                </p>
                                                <p className={`text-xs ${
                                                    selectedTemplate === key
                                                        ? 'text-indigo-600'
                                                        : 'text-gray-400'
                                                }`}>
                                                    {template.preview}
                                                </p>
                                            </div>
                                            
                                            {selectedTemplate === key && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sample Options */}
                        {selectedTemplate && TEMPLATE_TYPES[selectedTemplate].samples && (
                            <div>
                                <InputLabel value="Quick Start - Choose a Sample (Optional)" />
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {TEMPLATE_TYPES[selectedTemplate].samples.map((sample) => (
                                        <button
                                            key={sample}
                                            type="button"
                                            onClick={() => handleSampleSelect(sample)}
                                            className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                                                selectedSample === sample
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="text-sm font-medium">{sample}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Click a sample to auto-fill the form, or create your own custom page below
                                </p>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="label" value="Page Name" />
                                <TextInput
                                    id="label"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.label}
                                    onChange={handleLabelChange}
                                    placeholder="e.g., Inventory Management"
                                    autoFocus
                                />
                                <InputError message={errors.label} className="mt-2" />
                                
                                {/* Route Preview */}
                                {previewRoute && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <span className="font-medium">Generated URL:</span>{' '}
                                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                            {previewRoute}
                                        </code>
                                    </div>
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
                                    placeholder="Brief description of the page purpose"
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        {/* Icon Selection */}
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

                        {/* Permission Field */}
                        <div>
                            <InputLabel htmlFor="permission_required" value="Required Permission (Optional)" />
                            <select
                                id="permission_required"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={data.permission_required}
                                onChange={(e) => setData('permission_required', e.target.value)}
                            >
                                <option value="">No permission required (all authenticated users)</option>
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
                            <p className="mt-1 text-sm text-gray-500">
                                Select a permission to restrict access to this page, or leave empty for all authenticated users
                            </p>
                            
                            {/* Show permission description if one is selected */}
                            {data.permission_required && Object.values(permissions).some(perms => perms[data.permission_required]) && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-medium">Permission Description:</span>{' '}
                                        {Object.values(permissions).find(perms => perms[data.permission_required])?.[data.permission_required]?.description}
                                    </p>
                                </div>
                            )}
                            
                            <InputError message={errors.permission_required} className="mt-2" />
                        </div>

                        {/* Preview Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">What will be created:</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div>
                                    <span className="font-medium">File:</span>{' '}
                                    <code className="bg-white px-2 py-1 rounded text-xs">
                                        /resources/js/Pages/{data.label.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '')}/{data.label.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '')}.jsx
                                    </code>
                                </div>
                                <div>
                                    <span className="font-medium">Template:</span> {TEMPLATE_TYPES[selectedTemplate]?.name}
                                </div>
                                <div>
                                    <span className="font-medium">Layout:</span> AuthenticatedLayout (Tenant)
                                </div>
                                <div>
                                    <span className="font-medium">Features:</span> {TEMPLATE_TYPES[selectedTemplate]?.preview}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <SecondaryButton onClick={handleClose} disabled={processing}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={processing || !data.label}>
                                {processing ? 'Creating...' : 'Create Page & Navigation Item'}
                            </PrimaryButton>
                        </div>
                    </form>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div>
                        {loadingPages ? (
                            <div className="text-center py-8">
                                <div className="text-gray-500">Loading custom pages...</div>
                            </div>
                        ) : existingPages.length === 0 ? (
                            <div className="text-center py-12">
                                <CodeBracketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No custom pages yet</h3>
                                <p className="text-gray-500 mb-4">
                                    Create your first custom page to get started
                                </p>
                                <PrimaryButton onClick={() => setActiveTab('create')}>
                                    Create Your First Page
                                </PrimaryButton>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {existingPages.map((page) => (
                                    <div key={page.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="text-gray-400">
                                                    {(() => {
                                                        const IconComponent = TEMPLATE_TYPES[page.template_type]?.icon || DocumentTextIcon;
                                                        return <IconComponent className="h-6 w-6" />;
                                                    })()}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-medium text-gray-900">
                                                        {page.label}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {page.description || 'No description'}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {TEMPLATE_TYPES[page.template_type]?.name || 'Basic'}
                                                        </span>
                                                        {page.permission_required && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                Protected
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                            Created {new Date(page.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <SecondaryButton
                                                    onClick={() => window.open(page.route_name.replace('tenant.', '/tenant/'), '_blank')}
                                                    className="text-xs"
                                                >
                                                    <EyeIcon className="h-4 w-4 mr-1" />
                                                    Preview
                                                </SecondaryButton>
                                                <DangerButton
                                                    onClick={() => handleDeletePage(page.id)}
                                                    className="text-xs"
                                                >
                                                    <TrashIcon className="h-4 w-4 mr-1" />
                                                    Delete
                                                </DangerButton>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
} 