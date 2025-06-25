import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import CentralAdminLayout from '@/Layouts/CentralAdminLayout';
import DraggableNavigationItem from '@/Components/NavigationBuilder/DraggableNavigationItem';
import ConfigurationsModal from '@/Components/NavigationBuilder/ConfigurationsModal';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
    PlusIcon, 
    EyeIcon,
    DocumentArrowUpIcon,
    BuildingOffice2Icon,
    UserGroupIcon,
    UserIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    FolderOpenIcon
} from '@heroicons/react/24/outline';

export default function Builder({ 
    tenant, 
    configurations, 
    availableItems, 
    users, 
    roles 
}) {
    const [currentConfig, setCurrentConfig] = useState({
        name: 'New Configuration',
        items: [],
        layout: 'sidebar',
        theme: 'emerald'
    });
    
    const [selectedConfigType, setSelectedConfigType] = useState('default'); // default, role, user
    const [selectedTargetId, setSelectedTargetId] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showItemLibrary, setShowItemLibrary] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showConfigurationsModal, setShowConfigurationsModal] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load existing configuration when selected
    const loadConfiguration = (config) => {
        setCurrentConfig({
            name: config.name,
            items: config.configuration.items || [],
            layout: config.configuration.layout || 'sidebar',
            theme: config.configuration.theme || 'emerald',
            version: config.configuration.version || '1.0'
        });
        
        if (config.user_id) {
            setSelectedConfigType('user');
            setSelectedTargetId(config.user_id);
        } else if (config.role_id) {
            setSelectedConfigType('role');
            setSelectedTargetId(config.role_id);
        } else {
            setSelectedConfigType('default');
            setSelectedTargetId(null);
        }
    };

    // Load current navigation for a target
    const loadCurrentNavigation = async (type, targetId) => {
        try {
            // Get CSRF token with fallback
            const csrfTokenEl = document.querySelector('meta[name="csrf-token"]');
            if (!csrfTokenEl) {
                throw new Error('CSRF token not found in page. Please refresh the page.');
            }

            const response = await fetch(route('central-admin.navigation.current'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfTokenEl.content
                },
                body: JSON.stringify({
                    tenant_id: tenant.id,
                    type: type,
                    target_id: targetId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success && result.navigation) {
                setCurrentConfig(prev => ({
                    ...prev,
                    items: result.navigation.items || [],
                    layout: result.navigation.layout || 'sidebar',
                    theme: result.navigation.theme || 'emerald'
                }));
                
                setNotification({
                    type: 'success',
                    message: result.message || 'Current navigation loaded successfully'
                });
            } else {
                throw new Error(result.message || 'Failed to load navigation data');
            }
        } catch (error) {
            console.error('Failed to load current navigation:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Failed to load current navigation'
            });
        }
    };

    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCurrentConfig(prev => ({
                ...prev,
                items: arrayMove(
                    prev.items,
                    prev.items.findIndex(item => item.id === active.id),
                    prev.items.findIndex(item => item.id === over.id)
                )
            }));
        }
    };

    // Add item from library
    const addItemFromLibrary = (libraryItem) => {
        const newItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'link',
            label: libraryItem.label,
            icon: libraryItem.icon,
            route: libraryItem.route_name,
            permission: libraryItem.permission_required,
            order: currentConfig.items.length,
            visible: true,
        };

        setCurrentConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    // Delete item
    const deleteItem = (item) => {
        setCurrentConfig(prev => ({
            ...prev,
            items: prev.items.filter(i => i.id !== item.id)
        }));
    };

    // Toggle item visibility
    const toggleItemVisibility = (item) => {
        setCurrentConfig(prev => ({
            ...prev,
            items: prev.items.map(i => 
                i.id === item.id 
                    ? { ...i, visible: !i.visible }
                    : i
            )
        }));
    };

    // Save configuration
    const saveConfiguration = async (activate = false) => {
        setSaving(true);
        
        try {
            const payload = {
                tenant_id: tenant.id,
                name: currentConfig.name,
                configuration: {
                    items: currentConfig.items,
                    layout: currentConfig.layout,
                    theme: currentConfig.theme,
                    version: currentConfig.version
                },
                activate
            };

            if (selectedConfigType === 'user' && selectedTargetId) {
                payload.user_id = selectedTargetId;
            } else if (selectedConfigType === 'role' && selectedTargetId) {
                payload.role_id = selectedTargetId;
            }

            // Get CSRF token with fallback
            const csrfTokenEl = document.querySelector('meta[name="csrf-token"]');
            if (!csrfTokenEl) {
                throw new Error('CSRF token not found in page. Please refresh the page.');
            }

            const response = await fetch(route('central-admin.navigation.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfTokenEl.content
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                
                // Reload configurations
                router.reload({ only: ['configurations'] });
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Failed to save configuration'
            });
        } finally {
            setSaving(false);
        }
    };

    // Delete configuration
    const deleteConfiguration = async (config) => {
        try {
            // Get CSRF token with fallback
            const csrfTokenEl = document.querySelector('meta[name="csrf-token"]');
            if (!csrfTokenEl) {
                throw new Error('CSRF token not found in page. Please refresh the page.');
            }

            const response = await fetch(route('central-admin.navigation.destroy', config.id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfTokenEl.content
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                
                // Reload configurations
                router.reload({ only: ['configurations'] });
            } else {
                throw new Error(result.message || 'Failed to delete configuration');
            }
        } catch (error) {
            console.error('Failed to delete configuration:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Failed to delete configuration'
            });
            throw error; // Re-throw to handle in the modal
        }
    };

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <CentralAdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.visit(route('central-admin.navigation.index'))}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Navigation
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold leading-tight text-gray-900">
                                Navigation Builder
                            </h2>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                                <BuildingOffice2Icon className="h-4 w-4 mr-1" />
                                {tenant.name}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowConfigurationsModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            <FolderOpenIcon className="h-4 w-4 mr-2" />
                            Configurations
                        </button>
                        
                        <button
                            onClick={() => saveConfiguration(false)}
                            disabled={saving || !currentConfig.name.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        
                        <button
                            onClick={() => saveConfiguration(true)}
                            disabled={saving || !currentConfig.name.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            {saving ? 'Activating...' : 'Save & Activate'}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Navigation Builder - ${tenant.name}`} />

            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
                    notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    <div className="flex items-center">
                        {notification.type === 'success' ? (
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                        ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        )}
                        {notification.message}
                    </div>
                </div>
            )}

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Left Sidebar - Configuration Settings */}
                        <div className="col-span-3">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Configuration Settings
                                </h3>

                                {/* Configuration Name */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Configuration Name
                                    </label>
                                    <input
                                        type="text"
                                        value={currentConfig.name}
                                        onChange={(e) => setCurrentConfig(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        placeholder="e.g., Manager Layout"
                                    />
                                </div>

                                {/* Target Type */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Configuration Type
                                    </label>
                                    <select
                                        value={selectedConfigType}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            setSelectedConfigType(newType);
                                            setSelectedTargetId(null);
                                            
                                            // Load current navigation for default type
                                            if (newType === 'default') {
                                                loadCurrentNavigation(newType, null);
                                            }
                                        }}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    >
                                        <option value="default">Default (All Users)</option>
                                        <option value="role">Role-Specific</option>
                                        <option value="user">User-Specific</option>
                                    </select>
                                </div>

                                {/* Target Selection */}
                                {selectedConfigType === 'role' && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Role
                                        </label>
                                        <select
                                            value={selectedTargetId || ''}
                                            onChange={(e) => {
                                                const roleId = e.target.value ? parseInt(e.target.value) : null;
                                                setSelectedTargetId(roleId);
                                                
                                                // Load current navigation for this role
                                                if (roleId) {
                                                    loadCurrentNavigation('role', roleId);
                                                }
                                            }}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        >
                                            <option value="">Choose a role...</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedConfigType === 'user' && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select User
                                        </label>
                                        <select
                                            value={selectedTargetId || ''}
                                            onChange={(e) => {
                                                const userId = e.target.value ? parseInt(e.target.value) : null;
                                                setSelectedTargetId(userId);
                                                
                                                // Load current navigation for this user
                                                if (userId) {
                                                    loadCurrentNavigation('user', userId);
                                                }
                                            }}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        >
                                            <option value="">Choose a user...</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Load Current Navigation Button */}
                                {(selectedConfigType === 'default' || 
                                  (selectedConfigType === 'role' && selectedTargetId) || 
                                  (selectedConfigType === 'user' && selectedTargetId)) && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => loadCurrentNavigation(selectedConfigType, selectedTargetId)}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <EyeIcon className="h-4 w-4 mr-2" />
                                            Load Current Navigation
                                        </button>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Load the current navigation that this {selectedConfigType === 'default' ? 'tenant' : selectedConfigType} currently sees
                                        </p>
                                    </div>
                                )}

                                {/* Available Items */}
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                                        Available Items
                                    </h4>
                                    
                                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                                        {availableItems.map(category => (
                                            <div key={category.category} className="p-3 border-b border-gray-100 last:border-b-0">
                                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                    {category.label}
                                                </h5>
                                                <div className="space-y-1">
                                                    {category.items.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => addItemFromLibrary(item)}
                                                            className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 rounded flex items-center"
                                                        >
                                                            <PlusIcon className="h-3 w-3 mr-2 text-gray-400" />
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Load Existing Configuration */}
                                {Object.keys(configurations).length > 0 && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                Load Existing
                                            </h4>
                                            <button
                                                onClick={() => setShowConfigurationsModal(true)}
                                                className="text-xs text-purple-600 hover:text-purple-800"
                                            >
                                                View All
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {Object.entries(configurations).map(([type, configs]) => (
                                                <div key={type}>
                                                    <h5 className="text-xs font-semibold text-gray-500 uppercase">
                                                        {type} Configurations
                                                    </h5>
                                                    {configs.slice(0, 3).map(config => (
                                                        <div key={config.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded">
                                                            <button
                                                                onClick={() => loadConfiguration(config)}
                                                                className="flex-1 text-left text-xs text-gray-700"
                                                            >
                                                                {config.name}
                                                                {config.is_active && (
                                                                    <span className="ml-2 text-green-600">●</span>
                                                                )}
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {configs.length > 3 && (
                                                        <div className="text-xs text-gray-400 px-2">
                                                            +{configs.length - 3} more...
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Builder Area */}
                        <div className="col-span-6">
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Navigation Builder
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                        {currentConfig.items.length} items
                                    </span>
                                </div>

                                {currentConfig.items.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                        <div className="text-gray-400">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No navigation items</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Click on items from the Available Items list to add them to your navigation.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {currentConfig.items.map((item, index) => (
                                            <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {item.label}
                                                        </span>
                                                        {item.permission && (
                                                            <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                                {item.permission}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => deleteItem(item)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="col-span-3">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Live Preview
                                </h3>
                                
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="text-xs text-gray-500 mb-3">Navigation Preview</div>
                                    
                                    {currentConfig.items.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            No items to preview
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {currentConfig.items
                                                .filter(item => item.visible !== false)
                                                .map((item) => (
                                                    <div key={item.id} className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100">
                                                        <div className="h-4 w-4 mr-3 bg-gray-300 rounded"></div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Configuration Info */}
                                <div className="mt-4 text-xs text-gray-500">
                                    <div><strong>Type:</strong> {selectedConfigType === 'default' ? 'Default (All Users)' : selectedConfigType === 'role' ? 'Role-Specific' : 'User-Specific'}</div>
                                    {selectedConfigType === 'role' && selectedTargetId && (
                                        <div><strong>Role:</strong> {roles.find(r => r.id === selectedTargetId)?.name}</div>
                                    )}
                                    {selectedConfigType === 'user' && selectedTargetId && (
                                        <div><strong>User:</strong> {users.find(u => u.id === selectedTargetId)?.name}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configurations Modal */}
            <ConfigurationsModal
                isOpen={showConfigurationsModal}
                onClose={() => setShowConfigurationsModal(false)}
                configurations={configurations}
                onLoadConfiguration={loadConfiguration}
                onDeleteConfiguration={deleteConfiguration}
                users={users}
                roles={roles}
            />
        </CentralAdminLayout>
    );
} 