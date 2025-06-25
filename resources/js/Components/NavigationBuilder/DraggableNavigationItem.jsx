import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    Bars3Icon, 
    TrashIcon, 
    PencilIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';

export default function DraggableNavigationItem({ 
    item, 
    onEdit, 
    onDelete, 
    onToggleVisibility,
    isPreview = false 
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Get the icon component
    const IconComponent = HeroIcons[item.icon] || HeroIcons.QuestionMarkCircleIcon;

    // Different rendering for different item types
    const renderItemContent = () => {
        switch (item.type) {
            case 'divider':
                return (
                    <div className="flex items-center py-2">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-3 text-xs text-gray-500 bg-white">Divider</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                );
            
            case 'section':
                return (
                    <div className="py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {item.label}
                        </h3>
                        {item.children && item.children.length > 0 && (
                            <div className="ml-4 mt-2 space-y-1">
                                {item.children.map((child) => (
                                    <DraggableNavigationItem
                                        key={child.id}
                                        item={child}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleVisibility={onToggleVisibility}
                                        isPreview={isPreview}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            
            case 'link':
            default:
                return (
                    <div className="flex items-center py-2 px-3 rounded-md hover:bg-gray-50">
                        <IconComponent className="h-5 w-5 text-gray-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 flex-1">
                            {item.label}
                        </span>
                        {item.permission && (
                            <span className="text-xs text-gray-400 ml-2">
                                {item.permission}
                            </span>
                        )}
                    </div>
                );
        }
    };

    if (isPreview) {
        return (
            <div className={`${item.visible === false ? 'opacity-50' : ''}`}>
                {renderItemContent()}
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white border border-gray-200 rounded-lg p-3 mb-2 ${
                item.visible === false ? 'opacity-50 bg-gray-50' : ''
            }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            >
                <Bars3Icon className="h-4 w-4 text-gray-400" />
            </div>

            {/* Item Content */}
            <div className="ml-6">
                {renderItemContent()}
            </div>

            {/* Action Buttons */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <button
                    onClick={() => onToggleVisibility(item)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title={item.visible === false ? 'Show item' : 'Hide item'}
                >
                    {item.visible === false ? (
                        <EyeIcon className="h-4 w-4" />
                    ) : (
                        <EyeSlashIcon className="h-4 w-4" />
                    )}
                </button>
                
                <button
                    onClick={() => onEdit(item)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Edit item"
                >
                    <PencilIcon className="h-4 w-4" />
                </button>
                
                <button
                    onClick={() => onDelete(item)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete item"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Type Badge */}
            <div className="absolute top-1 right-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    item.type === 'link' ? 'bg-blue-100 text-blue-800' :
                    item.type === 'section' ? 'bg-purple-100 text-purple-800' :
                    item.type === 'divider' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {item.type}
                </span>
            </div>
        </div>
    );
} 