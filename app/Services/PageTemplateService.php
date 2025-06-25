<?php

namespace App\Services;

use App\Models\GeneratedPage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class PageTemplateService
{
    protected string $pagesPath;

    public function __construct()
    {
        $this->pagesPath = resource_path('js/Pages');
    }

    /**
     * Generate a React page component with custom directory structure
     */
    public function generatePage(array $config): void
    {
        $pageDirectory = $config['pageDirectory'];
        $componentName = $config['componentName'];
        $title = $config['title'];
        $description = $config['description'];
        $icon = $config['icon'];
        
        // Create directory path: /pages/PAGE NAME/
        $directoryPath = $this->pagesPath . '/' . $pageDirectory;
        
        // Ensure directory exists
        if (!File::exists($directoryPath)) {
            File::makeDirectory($directoryPath, 0755, true);
        }
        
        // Generate React component content
        $componentContent = $this->generateReactComponent($config);
        
        // File path: /pages/PAGE NAME/PAGECOMPONENT.jsx
        $filePath = $directoryPath . '/' . $componentName . '.jsx';
        
        // Write the file
        File::put($filePath, $componentContent);
        
        // Track in database
        GeneratedPage::updateOrCreate(
            ['navigation_item_key' => $config['key']],
            [
                'component_name' => $componentName,
                'page_directory' => $pageDirectory,
                'file_path' => $pageDirectory . '/' . $componentName . '.jsx',
                'route_name' => $config['routeName'],
                'title' => $title,
                'description' => $description,
                'icon' => $icon,
                'template_type' => $config['template_type'] ?? 'basic',
                'config' => $config['config'] ?? null,
                'is_active' => true,
            ]
        );
        
        // Also add the route to a dynamic routes file for registration
        $this->addDynamicRoute($config);
    }

    /**
     * Generate the React component content
     */
    protected function generateReactComponent(array $config): string
    {
        $componentName = $config['componentName'];
        $title = $config['title'];
        $description = $config['description'];
        $icon = $config['icon'];
        $templateType = $config['template_type'] ?? 'basic';
        
        // Get icon import based on the icon name
        $iconImport = $this->getIconImport($icon);
        
        // Generate template-specific content
        switch ($templateType) {
            case 'dashboard':
                return $this->generateDashboardTemplate($config, $iconImport);
            case 'table':
                return $this->generateTableTemplate($config, $iconImport);
            case 'form':
                return $this->generateFormTemplate($config, $iconImport);
            default:
                return $this->generateBasicTemplate($config, $iconImport);
        }
    }

    /**
     * Generate basic template
     */
    protected function generateBasicTemplate(array $config, string $iconImport): string
    {
        $componentName = $config['componentName'];
        $title = $config['title'];
        $description = $config['description'];
        $icon = $config['icon'];
        
        return <<<JSX
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
{$iconImport}

export default function {$componentName}({ pageTitle }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {$title}
                </h2>
            }
        >
            <Head title={pageTitle || '{$title}'} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">{$title}</h1>
                        <p className="mt-2 text-gray-600">{$description}</p>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="text-center py-16">
                            <{$this->getIconComponentName($icon)} className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to {$title}</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                This is your custom {$title} page. Start building your content here.
                            </p>
                            <div className="mt-6">
                                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Example Content Sections */}
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Feature 1 */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <{$this->getIconComponentName($icon)} className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Feature One</h3>
                            </div>
                            <p className="text-gray-600">Add your first feature or content section here.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <{$this->getIconComponentName($icon)} className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Feature Two</h3>
                            </div>
                            <p className="text-gray-600">Add your second feature or content section here.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <{$this->getIconComponentName($icon)} className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Feature Three</h3>
                            </div>
                            <p className="text-gray-600">Add your third feature or content section here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

JSX;
    }

    /**
     * Generate dashboard template
     */
    protected function generateDashboardTemplate(array $config, string $iconImport): string
    {
        $componentName = $config['componentName'];
        $title = $config['title'];
        $description = $config['description'];
        $icon = $config['icon'];
        
        return <<<JSX
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
{$iconImport}
import { ChartBarIcon, UsersIcon, TrendingUpIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function {$componentName}({ pageTitle }) {
    // Sample dashboard data
    const stats = [
        { name: 'Total Items', value: '1,234', change: '+12%', trend: 'up' },
        { name: 'Active Users', value: '567', change: '+5%', trend: 'up' },
        { name: 'Revenue', value: '\$12,345', change: '-2%', trend: 'down' },
        { name: 'Conversion Rate', value: '3.2%', change: '+8%', trend: 'up' },
    ];

    const recentActivity = [
        { id: 1, action: 'New item added', time: '2 minutes ago', user: 'John Doe' },
        { id: 2, action: 'Report generated', time: '5 minutes ago', user: 'Jane Smith' },
        { id: 3, action: 'Settings updated', time: '10 minutes ago', user: 'Admin' },
        { id: 4, action: 'User registered', time: '15 minutes ago', user: 'New User' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {$title}
                </h2>
            }
        >
            <Head title={pageTitle || '{$title}'} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">{$title}</h1>
                        <p className="mt-2 text-gray-600">{$description}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {stats.map((stat) => (
                            <div key={stat.name} className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <{$this->getIconComponentName($icon)} className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {stat.name}
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {stat.value}
                                                </div>
                                                <div className={`ml-2 flex items-baseline text-sm font-semibold \${
                                                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {stat.trend === 'up' ? (
                                                        <ArrowUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                                                    ) : (
                                                        <ArrowDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                                                    )}
                                                    <span className="ml-1">{stat.change}</span>
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Chart Placeholder */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
                            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Chart placeholder - integrate your preferred chart library</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{activity.action}</p>
                                            <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

JSX;
    }

    /**
     * Generate table template
     */
    protected function generateTableTemplate(array $config, string $iconImport): string
    {
        $componentName = $config['componentName'];
        $title = $config['title'];
        $description = $config['description'];
        $icon = $config['icon'];
        
        return <<<JSX
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
{$iconImport}
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function {$componentName}({ pageTitle }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Sample table data
    const [items, setItems] = useState([
        { id: 1, name: 'Sample Item 1', status: 'active', category: 'Category A', created: '2024-01-15', value: '\$100' },
        { id: 2, name: 'Sample Item 2', status: 'inactive', category: 'Category B', created: '2024-01-14', value: '\$250' },
        { id: 3, name: 'Sample Item 3', status: 'active', category: 'Category A', created: '2024-01-13', value: '\$75' },
        { id: 4, name: 'Sample Item 4', status: 'pending', category: 'Category C', created: '2024-01-12', value: '\$300' },
        { id: 5, name: 'Sample Item 5', status: 'active', category: 'Category B', created: '2024-01-11', value: '\$150' },
    ]);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {$title}
                </h2>
            }
        >
            <Head title={pageTitle || '{$title}'} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{$title}</h1>
                                <p className="mt-2 text-gray-600">{$description}</p>
                            </div>
                            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add New Item
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    <FunnelIcon className="h-4 w-4 mr-2" />
                                    More Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <{$this->getIconComponentName($icon)} className="h-6 w-6 text-gray-400 mr-3" />
                                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full \${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.created}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.value}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button className="text-indigo-600 hover:text-indigo-900">
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-900">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12">
                                <{$this->getIconComponentName($icon)} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Placeholder */}
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {filteredItems.length} of {items.length} results
                            </div>
                            <div className="flex space-x-2">
                                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">Previous</button>
                                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

JSX;
    }

    /**
     * Generate form template
     */
    protected function generateFormTemplate(array $config, string $iconImport): string
    {
        $componentName = $config['componentName'];
        $title = $config['title'];
        $description = $config['description'];
        $icon = $config['icon'];
        
        return <<<JSX
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
{$iconImport}
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function {$componentName}({ pageTitle }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        category: '',
        priority: 'medium',
        description: '',
        attachFile: null,
        newsletter: false,
        terms: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';
        if (!formData.category) newErrors.category = 'Please select a category';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.terms) newErrors.terms = 'You must accept the terms and conditions';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        setSubmitStatus(null);
        
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitStatus('success');
            // Reset form on success
            setFormData({
                name: '',
                email: '',
                category: '',
                priority: 'medium',
                description: '',
                attachFile: null,
                newsletter: false,
                terms: false
            });
        }, 2000);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {$title}
                </h2>
            }
        >
            <Head title={pageTitle || '{$title}'} />
            
            <div className="py-6">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">{$title}</h1>
                        <p className="mt-2 text-gray-600">{$description}</p>
                    </div>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                    <p className="mt-1 text-sm text-green-700">Your form has been submitted successfully.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <p className="mt-1 text-sm text-red-700">There was an error submitting your form. Please try again.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm \${
                                            errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                                        }`}
                                        placeholder="Enter your full name"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm \${
                                            errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                                        }`}
                                        placeholder="your@email.com"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>
                            </div>

                            {/* Category and Priority */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                        Category *
                                    </label>
                                    <select
                                        name="category"
                                        id="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm \${
                                            errors.category ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                                        }`}
                                    >
                                        <option value="">Select a category</option>
                                        <option value="general">General Inquiry</option>
                                        <option value="support">Technical Support</option>
                                        <option value="billing">Billing Question</option>
                                        <option value="feedback">Feedback</option>
                                    </select>
                                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                                </div>

                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                        Priority Level
                                    </label>
                                    <select
                                        name="priority"
                                        id="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    id="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm \${
                                        errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                                    }`}
                                    placeholder="Please provide detailed information..."
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>

                            {/* File Upload */}
                            <div>
                                <label htmlFor="attachFile" className="block text-sm font-medium text-gray-700">
                                    Attach File (Optional)
                                </label>
                                <input
                                    type="file"
                                    name="attachFile"
                                    id="attachFile"
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="newsletter"
                                        id="newsletter"
                                        checked={formData.newsletter}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                                        Subscribe to our newsletter for updates
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="terms"
                                        id="terms"
                                        checked={formData.terms}
                                        onChange={handleInputChange}
                                        className={`h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 \${
                                            errors.terms ? 'border-red-300' : ''
                                        }`}
                                    />
                                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                                        I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500">terms and conditions</a> *
                                    </label>
                                </div>
                                {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 \${
                                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Form'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Help Section */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex">
                            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Need Help?</h3>
                                <p className="mt-1 text-sm text-blue-700">
                                    If you're having trouble with this form, please contact our support team or check our FAQ section.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

JSX;
    }

    /**
     * Get the icon import statement
     */
    protected function getIconImport(string $iconName): string
    {
        // Extract icon name without "Icon" suffix for import
        $iconForImport = str_replace('Icon', '', $iconName);
        
        return "import { {$iconForImport}Icon } from '@heroicons/react/24/outline';";
    }

    /**
     * Get the icon component name for use in JSX
     */
    protected function getIconComponentName(string $iconName): string
    {
        // Ensure it ends with "Icon"
        return str_replace('Icon', '', $iconName) . 'Icon';
    }

    /**
     * Add dynamic route registration
     */
    protected function addDynamicRoute(array $config): void
    {
        $routeName = $config['routeName'];
        $key = $config['key'];
        $componentName = $config['componentName'];
        $pageDirectory = $config['pageDirectory'];
        $title = $config['title'];
        
        // Path to the dynamic routes file
        $dynamicRoutesFile = base_path('routes/dynamic.php');
        
        // Create the file if it doesn't exist
        if (!File::exists($dynamicRoutesFile)) {
            $initialContent = <<<PHP
<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Dynamic Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are automatically generated by the PageTemplateService
| when custom navigation items are created.
|
*/

PHP;
            File::put($dynamicRoutesFile, $initialContent);
        }
        
        // Generate the route definition
        $routeDefinition = <<<PHP

// Auto-generated route for: {$title}
Route::get('/{$key}', function () {
    return Inertia::render('{$pageDirectory}/{$componentName}', [
        'pageTitle' => '{$title}'
    ]);
})->middleware('auth')->name('{$routeName}');
PHP;
        
        // Read current content
        $currentContent = File::get($dynamicRoutesFile);
        
        // Check if route already exists
        if (!str_contains($currentContent, "name('{$routeName}')")) {
            // Append the new route
            File::append($dynamicRoutesFile, $routeDefinition);
        }
    }

    /**
     * Check if a page already exists
     */
    public function pageExists(string $pageDirectory, string $componentName): bool
    {
        $filePath = $this->pagesPath . '/' . $pageDirectory . '/' . $componentName . '.jsx';
        return File::exists($filePath);
    }

    /**
     * Delete a generated page
     */
    public function deletePage(string $pageDirectory, string $componentName): void
    {
        $directoryPath = $this->pagesPath . '/' . $pageDirectory;
        $filePath = $directoryPath . '/' . $componentName . '.jsx';
        
        // Delete the component file
        if (File::exists($filePath)) {
            File::delete($filePath);
        }
        
        // Delete the directory if it's empty
        if (File::exists($directoryPath) && empty(File::files($directoryPath))) {
            File::deleteDirectory($directoryPath);
        }
    }

    /**
     * Get available template types
     */
    public function getAvailableTemplates(): array
    {
        return [
            'basic' => [
                'name' => 'Basic Page',
                'description' => 'Simple page with header and content area',
                'preview' => 'Basic layout with placeholder content'
            ],
            'dashboard' => [
                'name' => 'Dashboard',
                'description' => 'Dashboard layout with metrics and widgets',
                'preview' => 'Dashboard with stats cards and charts'
            ],
            'table' => [
                'name' => 'Data Table',
                'description' => 'Page with data table and filters',
                'preview' => 'Table view with search and pagination'
            ],
            'form' => [
                'name' => 'Form Page',
                'description' => 'Page with form inputs and validation',
                'preview' => 'Form layout with input fields'
            ]
        ];
    }
} 