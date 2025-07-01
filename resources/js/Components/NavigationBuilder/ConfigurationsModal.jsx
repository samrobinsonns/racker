import { useState } from 'react';
import { 
    XMarkIcon,
    FolderOpenIcon,
    TrashIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';

export default function ConfigurationsModal({ 
    isOpen, 
    onClose, 
    configurations, 
    onLoadConfiguration, 
    onDeleteConfiguration,
    roles 
}) {
    const [deletingConfig, setDeletingConfig] = useState(null);

    const handleDeleteConfiguration = async (config) => {
        if (!confirm(`Delete "${config.name}"? This cannot be undone.`)) return;
        
        setDeletingConfig(config.id);
        try {
            await onDeleteConfiguration(config);
        } catch (error) {
            console.error('Failed to delete configuration:', error);
        } finally {
            setDeletingConfig(null);
        }
    };

    const getTargetLabel = (config) => {
        if (config.role_id && Array.isArray(roles)) {
            const role = roles.find(r => r.id === config.role_id);
            return role ? role.name : 'Unknown Role';
        }
        return 'Default';
    };

    const getTypeIcon = (config) => {
        if (config.role_id) return '👥';
        return '🌐';
    };

    // Flatten all configurations into a single array
    const allConfigs = Object.values(configurations).flat();

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <FolderOpenIcon className="h-5 w-5 text-purple-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">
                            Saved Configurations
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Configurations List */}
                {allConfigs.length === 0 ? (
                    <div className="text-center py-8">
                        <FolderOpenIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                            No saved configurations yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {allConfigs.map(config => (
                            <div 
                                key={config.id} 
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex items-center flex-1 min-w-0">
                                    <span className="text-lg mr-3 flex-shrink-0">
                                        {getTypeIcon(config)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center">
                                            <h5 className="text-sm font-medium text-gray-900 truncate">
                                                {config.name}
                                            </h5>
                                            {config.is_active && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {getTargetLabel(config)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            onLoadConfiguration(config);
                                            onClose();
                                        }}
                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                                    >
                                        <EyeIcon className="h-3 w-3 mr-1" />
                                        Load
                                    </button>
                                    
                                    <button
                                        onClick={() => handleDeleteConfiguration(config)}
                                        disabled={deletingConfig === config.id}
                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                                    >
                                        <TrashIcon className="h-3 w-3 mr-1" />
                                        {deletingConfig === config.id ? '...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
} 