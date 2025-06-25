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
    ArrowLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    FolderOpenIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';

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
    
    const [selectedRoleId, setSelectedRoleId] = useState(null);
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
        
        if (config.role_id) {
            setSelectedRoleId(config.role_id);
        } else {
            setSelectedRoleId(null);
        }
    };

    // Load current navigation for a role
    const loadCurrentNavigation = async (roleId) => {
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
                    type: 'role',
                    target_id: roleId
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

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Check if dropping into a dropdown
        if (overId.toString().startsWith('dropdown-')) {
            const dropdownId = overId.replace('dropdown-', '');
            moveItemToDropdown(activeId, dropdownId);
            return;
        }

        // Regular reordering
        if (activeId !== overId) {
            setCurrentConfig(prev => ({
                ...prev,
                items: arrayMove(
                    prev.items,
                    prev.items.findIndex(item => item.id === activeId),
                    prev.items.findIndex(item => item.id === overId)
                )
            }));
        }
    };

    // Move item to dropdown
    const moveItemToDropdown = (itemId, dropdownId) => {
        setCurrentConfig(prev => {
            const items = [...prev.items];
            const itemIndex = items.findIndex(item => item.id === itemId);
            const dropdownIndex = items.findIndex(item => item.id === dropdownId);
            
            if (itemIndex === -1 || dropdownIndex === -1) return prev;
            
            const [movedItem] = items.splice(itemIndex, 1);
            
            // Convert to child item
            const childItem = {
                ...movedItem,
                id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'link'
            };
            
            items[dropdownIndex > itemIndex ? dropdownIndex - 1 : dropdownIndex] = {
                ...items[dropdownIndex > itemIndex ? dropdownIndex - 1 : dropdownIndex],
                children: [...(items[dropdownIndex > itemIndex ? dropdownIndex - 1 : dropdownIndex].children || []), childItem]
            };
            
            return { ...prev, items };
        });
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
            children: []
        };

        setCurrentConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    // Add dropdown menu
    const addDropdownMenu = () => {
        const newItem = {
            id: `dropdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'dropdown',
            label: 'New Dropdown',
            icon: '📁',
            order: currentConfig.items.length,
            visible: true,
            children: []
        };

        setCurrentConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    // Add child item to dropdown
    const addChildItem = (parentId, childItem = null) => {
        const newChild = childItem || {
            id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'link',
            label: 'New Item',
            icon: '🔗',
            route: '',
            permission: '',
            visible: true
        };

        setCurrentConfig(prev => ({
            ...prev,
            items: prev.items.map(item => 
                item.id === parentId 
                    ? { ...item, children: [...(item.children || []), newChild] }
                    : item
            )
        }));
    };

    // Delete item
    const deleteItem = (itemId, parentId = null) => {
        setCurrentConfig(prev => ({
            ...prev,
            items: parentId 
                ? prev.items.map(item => 
                    item.id === parentId 
                        ? { ...item, children: item.children.filter(child => child.id !== itemId) }
                        : item
                  )
                : prev.items.filter(i => i.id !== itemId)
        }));
    };

    // Update item
    const updateItem = (itemId, updates, parentId = null) => {
        setCurrentConfig(prev => ({
            ...prev,
            items: parentId
                ? prev.items.map(item => 
                    item.id === parentId 
                        ? { ...item, children: item.children.map(child => 
                            child.id === itemId ? { ...child, ...updates } : child
                          )}
                        : item
                  )
                : prev.items.map(item => 
                    item.id === itemId ? { ...item, ...updates } : item
                  )
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

            if (selectedRoleId) {
                payload.role_id = selectedRoleId;
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

    // Render Heroicon
    const renderIcon = (iconName, className = "h-5 w-5") => {
        if (!iconName) return null;
        const IconComponent = HeroIcons[iconName];
        if (!IconComponent) {
            console.warn(`Icon "${iconName}" not found in Heroicons`);
            return null;
        }
        return <IconComponent className={className} />;
    };

    const getDefaultIcon = (isDropdown, className = "h-5 w-5") => {
        return isDropdown ? 
            <HeroIcons.FolderIcon className={className} /> : 
            <HeroIcons.LinkIcon className={className} />;
    };

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
                                Role Navigation Builder
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
                            disabled={saving || !currentConfig.name.trim() || !selectedRoleId}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        
                        <button
                            onClick={() => saveConfiguration(true)}
                            disabled={saving || !currentConfig.name.trim() || !selectedRoleId}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            {saving ? 'Activating...' : 'Save & Activate'}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Role Navigation Builder - ${tenant.name}`} />

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
                                    Role Settings
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

                                {/* Role Selection */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Role
                                    </label>
                                    <select
                                        value={selectedRoleId || ''}
                                        onChange={(e) => {
                                            const roleId = e.target.value ? parseInt(e.target.value) : null;
                                            setSelectedRoleId(roleId);
                                            
                                            // Update configuration name for role-specific
                                            if (roleId) {
                                                const role = roles.find(r => r.id === roleId);
                                                setCurrentConfig(prev => ({
                                                    ...prev,
                                                    name: `${role?.name} Navigation`
                                                }));
                                                loadCurrentNavigation(roleId);
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



                                {/* Load Current Navigation Button */}
                                {selectedRoleId && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => loadCurrentNavigation(selectedRoleId)}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <EyeIcon className="h-4 w-4 mr-2" />
                                            Load Current Navigation
                                        </button>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Load the current navigation that this role currently sees
                                        </p>
                                    </div>
                                )}

                                {/* Quick Add Buttons */}
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                                        Quick Add
                                    </h4>
                                    
                                    <div className="space-y-2 mb-4">
                                        <button
                                            onClick={addDropdownMenu}
                                            className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all duration-200"
                                        >
                                                                                                        <FolderOpenIcon className="h-5 w-5 mr-2" />
                                                            Add Dropdown Menu
                                        </button>
                                    </div>
                                </div>

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
                                                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center transition-colors duration-150 group"
                                                        >
                                                                                                                                        <div className="mr-2">
                                                                                {item.icon ? renderIcon(item.icon) || getDefaultIcon(false) : getDefaultIcon(false)}
                                                                            </div>
                                                            <span className="flex-1">{item.label}</span>
                                                            <PlusIcon className="h-3 w-3 text-gray-400 group-hover:text-blue-500" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>


                            </div>
                        </div>

                        {/* Main Builder Area */}
                        <div className="col-span-6">
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        🎨 Navigation Builder
                                    </h3>
                                    <div className="flex items-center space-x-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {currentConfig.items.length} items
                                        </span>
                                    </div>
                                </div>

                                <DndContext 
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    {currentConfig.items.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50">
                                            <div className="text-gray-400">
                                                <div className="text-6xl mb-4">🎯</div>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Let's build something amazing!</h3>
                                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                                Add items from the sidebar, create dropdown menus, and drag items around to organize your navigation.
                                            </p>
                                            <div className="mt-4 text-xs text-gray-400 space-y-1">
                                                <div className="flex items-center justify-center">
                                                    <span className="mr-1">🎯</span>
                                                    <strong>Drag items here to add to navigation</strong>
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <span className="mr-1">📁</span>
                                                    <span>Drag items onto dropdown menus to organize them</span>
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <HeroIcons.SwatchIcon className="h-3 w-3 mr-1" />
                                                    <span>Click any icon to change it</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <SortableContext 
                                            items={currentConfig.items.map(item => item.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-3">
                                                {currentConfig.items.map((item) => (
                                                    <DraggableNavigationItem
                                                        key={item.id}
                                                        item={item}
                                                        onDelete={(itemId) => deleteItem(itemId)}
                                                        onUpdate={(itemId, updates) => updateItem(itemId, updates)}
                                                        onAddChild={(parentId) => addChildItem(parentId)}
                                                        onDeleteChild={(childId, parentId) => deleteItem(childId, parentId)}
                                                        onUpdateChild={(childId, updates, parentId) => updateItem(childId, updates, parentId)}
                                                        onMoveToDropdown={moveItemToDropdown}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    )}
                                </DndContext>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="col-span-3">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    ✨ Live Preview
                                </h3>
                                
                                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-blue-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs font-medium text-gray-600">Navigation Preview</div>
                                        <div className="text-xs text-gray-500">
                                            {currentConfig.items.filter(item => item.visible !== false).length} visible
                                        </div>
                                    </div>
                                    
                                    {currentConfig.items.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            <div className="text-2xl mb-2">📱</div>
                                            <div>No items to preview</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {currentConfig.items
                                                .filter(item => item.visible !== false)
                                                .map((item) => (
                                                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                                        <div className="flex items-center py-3 px-4 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <div className="mr-3 text-gray-600">
                                                                {item.icon ? renderIcon(item.icon) || getDefaultIcon(item.type === 'dropdown') : getDefaultIcon(item.type === 'dropdown')}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900 flex-1">
                                                                {item.label}
                                                            </span>
                                                            {item.type === 'dropdown' && item.children && item.children.length > 0 && (
                                                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        
                                                        {/* Show dropdown children in preview */}
                                                        {item.type === 'dropdown' && item.children && item.children.length > 0 && (
                                                            <div className="bg-gray-50 border-t border-gray-100 rounded-b-lg">
                                                                <div className="py-2 px-4 pl-8">
                                                                    {item.children
                                                                        .filter(child => child.visible !== false)
                                                                        .map((child) => (
                                                                            <div key={child.id} className="flex items-center py-1 px-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                                                                <div className="mr-2">
                                                                                    {child.icon ? renderIcon(child.icon, "h-4 w-4") || getDefaultIcon(false, "h-4 w-4") : getDefaultIcon(false, "h-4 w-4")}
                                                                                </div>
                                                                                {child.label}
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Configuration Info */}
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs font-medium text-gray-600 mb-1">Configuration</div>
                                    {selectedRoleId ? (
                                        <div className="flex items-center text-sm">
                                            <span className="text-base mr-2">👥</span>
                                            <span className="font-medium">{roles.find(r => r.id === selectedRoleId)?.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-400 flex items-center">
                                            <span className="text-base mr-2">⚠️</span>
                                            No role selected
                                        </div>
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
                roles={roles}
            />
        </CentralAdminLayout>
    );
} 