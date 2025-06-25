import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    Bars3Icon,
    TrashIcon,
    PlusIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon,
    SwatchIcon
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import IconPicker from './IconPicker';

// Enhanced droppable area for dropdown content
function DropdownContentArea({ dropdownId, isOver, children }) {
    const {
        setNodeRef,
        isOver: isDroppableOver,
    } = useDroppable({
        id: `dropdown-${dropdownId}`,
    });

    return (
        <div 
            ref={setNodeRef}
            className={`
                min-h-[60px] transition-all duration-200 rounded-lg
                ${isDroppableOver ? 'bg-green-50 ring-2 ring-green-300 ring-inset' : ''}
            `}
        >
            {children}
        </div>
    );
}

export default function DraggableNavigationItem({ 
    item, 
    onDelete, 
    onUpdate, 
    onAddChild, 
    onDeleteChild, 
    onUpdateChild,
    onMoveToDropdown 
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingChild, setIsEditingChild] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [editValue, setEditValue] = useState(item.label);
    const [childEditValue, setChildEditValue] = useState('');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showChildIconPicker, setShowChildIconPicker] = useState(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    // Droppable for dropdown containers
    const {
        setNodeRef: setDroppableRef,
        isOver,
    } = useDroppable({
        id: `dropdown-${item.id}`,
        disabled: item.type !== 'dropdown'
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSaveEdit = () => {
        onUpdate(item.id, { label: editValue });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditValue(item.label);
        setIsEditing(false);
    };

    const handleSaveChildEdit = (childId) => {
        onUpdateChild(childId, { label: childEditValue }, item.id);
        setIsEditingChild(null);
        setChildEditValue('');
    };

    const handleCancelChildEdit = () => {
        setIsEditingChild(null);
        setChildEditValue('');
    };

    const startEditingChild = (child) => {
        setIsEditingChild(child.id);
        setChildEditValue(child.label);
    };

    const toggleVisibility = () => {
        onUpdate(item.id, { visible: !item.visible });
    };

    const toggleChildVisibility = (childId, currentVisibility) => {
        onUpdateChild(childId, { visible: !currentVisibility }, item.id);
    };

    const handleIconSelect = (icon) => {
        onUpdate(item.id, { icon });
    };

    const handleChildIconSelect = (childId, icon) => {
        onUpdateChild(childId, { icon }, item.id);
        setShowChildIconPicker(null);
    };

    const renderIcon = (iconName, className = "h-6 w-6") => {
        if (!iconName) return null;
        const IconComponent = HeroIcons[iconName];
        if (!IconComponent) {
            console.warn(`Icon "${iconName}" not found in Heroicons`);
            return null;
        }
        return <IconComponent className={className} />;
    };

    const getDefaultIcon = (isDropdown, className = "h-6 w-6") => {
        return isDropdown ? 
            <HeroIcons.FolderIcon className={className} /> : 
            <HeroIcons.LinkIcon className={className} />;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative ${isDragging ? 'z-50' : ''}`}
        >
            {/* Main Item */}
            <div 
                className={`
                    bg-white border-2 rounded-xl shadow-sm transition-all duration-200
                    ${isDragging 
                        ? 'border-blue-400 shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }
                    ${!item.visible ? 'opacity-60' : ''}
                    ${item.type === 'dropdown' && isOver ? 'border-green-400 bg-green-50 ring-2 ring-green-200' : ''}
                `}
            >
                <div className="flex items-center p-4">
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing mr-3 p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        <Bars3Icon className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Item Icon */}
                    <button
                        onClick={() => setShowIconPicker(true)}
                        className="mr-3 flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors group/icon"
                        title="Change icon"
                    >
                        <div className="relative">
                            {item.icon ? renderIcon(item.icon) || getDefaultIcon(item.type === 'dropdown') : getDefaultIcon(item.type === 'dropdown')}
                            <SwatchIcon className="absolute -bottom-1 -right-1 h-3 w-3 text-gray-400 opacity-0 group-hover/icon:opacity-100 transition-opacity bg-white rounded-full p-0.5" />
                        </div>
                    </button>

                    {/* Dropdown Toggle */}
                    {item.type === 'dropdown' && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mr-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            )}
                        </button>
                    )}

                    {/* Item Label */}
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit();
                                        if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveEdit}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                    <CheckIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 mr-2">
                                    {item.label}
                                </span>
                                {item.permission && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {item.permission}
                                    </span>
                                )}
                                {item.type === 'dropdown' && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {item.children?.length || 0} items
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={toggleVisibility}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title={item.visible ? 'Hide item' : 'Show item'}
                        >
                            {item.visible ? (
                                <EyeIcon className="h-4 w-4" />
                            ) : (
                                <EyeSlashIcon className="h-4 w-4" />
                            )}
                        </button>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit item"
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete item"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Child Items */}
                {item.type === 'dropdown' && isExpanded && item.children && item.children.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <DropdownContentArea dropdownId={item.id} isOver={isOver}>
                            <div className="p-6">
                                {isOver && (
                                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center text-green-700 text-sm font-medium">
                                        <HeroIcons.ArrowDownIcon className="h-4 w-4 mr-2" />
                                        Drop here to add new item to this dropdown
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {item.children.map((child) => (
                                    <div
                                        key={child.id}
                                        className={`
                                            flex items-center p-3 bg-white border border-gray-200 rounded-lg
                                            hover:border-blue-300 hover:shadow-sm transition-all duration-150
                                            ${!child.visible ? 'opacity-60' : ''}
                                        `}
                                    >
                                        <button
                                            onClick={() => setShowChildIconPicker(child.id)}
                                            className="mr-3 flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors group/child-icon"
                                            title="Change icon"
                                        >
                                            <div className="relative">
                                                {child.icon ? renderIcon(child.icon, "h-4 w-4") || getDefaultIcon(false, "h-4 w-4") : getDefaultIcon(false, "h-4 w-4")}
                                                <SwatchIcon className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-gray-400 opacity-0 group-hover/child-icon:opacity-100 transition-opacity bg-white rounded-full p-0.5" />
                                            </div>
                                        </button>

                                        <div className="flex-1">
                                            {isEditingChild === child.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={childEditValue}
                                                        onChange={(e) => setChildEditValue(e.target.value)}
                                                        className="flex-1 px-2 py-1 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveChildEdit(child.id);
                                                            if (e.key === 'Escape') handleCancelChildEdit();
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleSaveChildEdit(child.id)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelChildEdit}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-700 mr-2">
                                                        {child.label}
                                                    </span>
                                                    {child.permission && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            {child.permission}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleChildVisibility(child.id, child.visible)}
                                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                title={child.visible ? 'Hide item' : 'Show item'}
                                            >
                                                {child.visible ? (
                                                    <EyeIcon className="h-3 w-3" />
                                                ) : (
                                                    <EyeSlashIcon className="h-3 w-3" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => startEditingChild(child)}
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Edit child item"
                                            >
                                                <PencilIcon className="h-3 w-3" />
                                            </button>

                                            <button
                                                onClick={() => onDeleteChild(child.id, item.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete child item"
                                            >
                                                <TrashIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </DropdownContentArea>
                    </div>
                )}

                {/* Add Child Button for Empty Dropdowns */}
                {item.type === 'dropdown' && isExpanded && (!item.children || item.children.length === 0) && (
                    <div className="border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <DropdownContentArea dropdownId={item.id} isOver={isOver}>
                            <div className="p-6">
                                <div 
                                    className={`
                                        w-full flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed rounded-xl text-sm font-medium transition-all duration-200
                                        ${isOver 
                                            ? 'border-green-400 bg-green-100 text-green-700' 
                                            : 'border-gray-300 text-gray-500 hover:border-blue-300 hover:bg-blue-50'
                                        }
                                    `}
                                >
                                    {isOver ? (
                                        <>
                                            <HeroIcons.ArrowDownIcon className="h-8 w-8 mb-3 text-green-600" />
                                            <span className="text-base font-semibold">Drop item here</span>
                                            <span className="text-sm text-green-600">to add to this dropdown</span>
                                        </>
                                    ) : (
                                        <>
                                            <HeroIcons.FolderIcon className="h-8 w-8 mb-3 text-gray-400" />
                                            <span className="text-base font-medium">Empty dropdown</span>
                                            <span className="text-sm text-gray-400">Drag navigation items here</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </DropdownContentArea>
                    </div>
                )}
            </div>

            {/* Icon Picker Modal */}
            <IconPicker
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                onSelectIcon={handleIconSelect}
                currentIcon={item.icon}
            />

            {/* Child Icon Picker Modal */}
            {showChildIconPicker && (
                <IconPicker
                    isOpen={true}
                    onClose={() => setShowChildIconPicker(null)}
                    onSelectIcon={(icon) => handleChildIconSelect(showChildIconPicker, icon)}
                    currentIcon={item.children?.find(c => c.id === showChildIconPicker)?.icon}
                />
            )}
        </div>
    );
} 