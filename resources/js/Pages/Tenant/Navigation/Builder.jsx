import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DraggableNavigationItem from '@/Components/NavigationBuilder/DraggableNavigationItem';
import ConfigurationsModal from '@/Components/NavigationBuilder/ConfigurationsModal';
import CustomPagesModal from '@/Components/NavigationBuilder/CustomPagesModal';
import BrandingEditor from '@/Components/NavigationBuilder/BrandingEditor';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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
    DocumentArrowUpIcon,
    BuildingOffice2Icon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    FolderOpenIcon,
    ChevronDownIcon,
    PaintBrushIcon
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';

export default function Builder({ tenant, configurations, availableItems }) {
    const [currentConfig, setCurrentConfig] = useState({
        name: 'Default Navigation',
        items: [],
        layout: 'sidebar',
        theme: 'emerald',
        branding: {
            logo: 'BuildingOffice2Icon',
            logoType: 'icon',
            title: '',
            subtitle: '',
            primaryColor: '#22c55e',
            logoUrl: null
        }
    });
    
    const [showPreview, setShowPreview] = useState(false);
    const [showItemLibrary, setShowItemLibrary] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showConfigurationsModal, setShowConfigurationsModal] = useState(false);
    const [showCustomPagesModal, setShowCustomPagesModal] = useState(false);
    const [activeTab, setActiveTab] = useState('items');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load existing configuration
    const loadConfiguration = (config) => {
        setCurrentConfig({
            name: config.name,
            items: config.configuration.items || [],
            layout: config.configuration.layout || 'sidebar',
            theme: config.configuration.theme || 'emerald',
            version: config.configuration.version || '1.0',
            branding: {
                logo: config.configuration.branding?.logo || 'BuildingOffice2Icon',
                logoType: config.configuration.branding?.logoType || 'icon',
                title: config.configuration.branding?.title || '',
                subtitle: config.configuration.branding?.subtitle || '',
                primaryColor: config.configuration.branding?.primaryColor || '#22c55e',
                logoUrl: config.configuration.branding?.logoUrl || null
            }
        });
    };

    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (overId.toString().startsWith('dropdown-')) {
            const dropdownId = overId.replace('dropdown-', '');
            moveItemToDropdown(activeId, dropdownId);
            return;
        }

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
            type: libraryItem.key === 'divider' ? 'divider' : 'link',
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
            icon: 'FolderIcon',
            order: currentConfig.items.length,
            visible: true,
            children: []
        };

        setCurrentConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
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
                    version: currentConfig.version,
                    branding: currentConfig.branding
                },
                activate
            };

            const response = await fetch(route('tenant.navigation.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                
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
        return IconComponent ? <IconComponent className={className} /> : null;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Navigation Builder
                    </h2>
                    <div className="flex items-center space-x-3">
                        <SecondaryButton
                            onClick={() => setShowConfigurationsModal(true)}
                        >
                            <FolderOpenIcon className="h-4 w-4 mr-2" />
                            Saved Configurations
                        </SecondaryButton>
                        
                        <PrimaryButton
                            onClick={() => saveConfiguration(false)}
                            disabled={saving}
                        >
                            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </PrimaryButton>
                        
                        <PrimaryButton
                            onClick={() => saveConfiguration(true)}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                        >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            {saving ? 'Activating...' : 'Save & Activate'}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title="Navigation Builder" />

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
                        {/* Left Sidebar */}
                        <div className="col-span-3">
                            <div className="bg-white shadow rounded-lg">
                                <div className="p-6">
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
                                            placeholder="e.g., Default Navigation"
                                        />
                                    </div>

                                    {/* Quick Add Buttons */}
                                    <div className="mt-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                                            Quick Add
                                        </h4>
                                        
                                        <div className="space-y-2">
                                            <button
                                                onClick={addDropdownMenu}
                                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                <FolderOpenIcon className="h-4 w-4 mr-2" />
                                                Add Dropdown Menu
                                            </button>
                                        </div>
                                    </div>

                                    {/* Available Items */}
                                    <div className="mt-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                                            Available Items
                                        </h4>
                                        
                                        <div className="space-y-4">
                                            {availableItems.map(category => (
                                                <div key={category.category}>
                                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                        {category.label}
                                                    </h5>
                                                    <div className="space-y-1">
                                                        {category.items.map(item => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => addItemFromLibrary(item)}
                                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center"
                                                            >
                                                                {renderIcon(item.icon)}
                                                                <span className="ml-2">{item.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Builder Area */}
                        <div className="col-span-6">
                            <div className="bg-white shadow rounded-lg p-6">
                                <DndContext 
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
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
                                                    onMoveToDropdown={moveItemToDropdown}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {currentConfig.items.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">
                                            Drag items here to build your navigation
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="col-span-3">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Preview
                                </h3>
                                
                                <div className="border rounded-lg p-4">
                                    {currentConfig.items.map((item) => (
                                        <div key={item.id} className="py-2">
                                            <div className="flex items-center">
                                                {renderIcon(item.icon)}
                                                <span className="ml-2">{item.label}</span>
                                            </div>
                                            {item.children && item.children.length > 0 && (
                                                <div className="ml-6 mt-2">
                                                    {item.children.map((child) => (
                                                        <div key={child.id} className="py-1 flex items-center">
                                                            {renderIcon(child.icon)}
                                                            <span className="ml-2">{child.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
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
            />
        </AuthenticatedLayout>
    );
} 