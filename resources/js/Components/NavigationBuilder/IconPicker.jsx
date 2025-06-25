import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import * as HeroIcons from '@heroicons/react/24/outline';

const ICON_CATEGORIES = {
    'Navigation': [
        'HomeIcon', 'FolderIcon', 'DocumentIcon', 'ChartBarIcon', 'Cog6ToothIcon', 
        'UserIcon', 'UsersIcon', 'BuildingOfficeIcon', 'MapIcon', 'GlobeAltIcon',
        'ArrowRightIcon', 'ChevronRightIcon', 'Bars3Icon', 'EllipsisHorizontalIcon'
    ],
    'Business': [
        'BriefcaseIcon', 'CurrencyDollarIcon', 'ChartPieIcon', 'TrendingUpIcon', 'TrendingDownIcon',
        'BanknotesIcon', 'CreditCardIcon', 'ScaleIcon', 'ShoppingCartIcon',
        'TruckIcon', 'BuildingStorefrontIcon', 'PresentationChartLineIcon', 'ClipboardDocumentListIcon'
    ],
    'People & Teams': [
        'UserIcon', 'UsersIcon', 'UserGroupIcon', 'UserCircleIcon', 'IdentificationIcon',
        'AcademicCapIcon', 'HandRaisedIcon', 'HeartIcon', 'ChatBubbleLeftRightIcon', 'PhoneIcon',
        'EnvelopeIcon', 'AtSymbolIcon', 'MegaphoneIcon', 'SpeakerWaveIcon'
    ],
    'Technology': [
        'ComputerDesktopIcon', 'DevicePhoneMobileIcon', 'ServerIcon', 'CloudIcon', 'WifiIcon',
        'CpuChipIcon', 'CommandLineIcon', 'CodeBracketIcon', 'BugAntIcon',
        'WrenchScrewdriverIcon', 'CogIcon', 'Cog6ToothIcon'
    ],
    'Communication': [
        'ChatBubbleLeftIcon', 'ChatBubbleLeftRightIcon', 'EnvelopeIcon', 'PhoneIcon', 'VideoCameraIcon',
        'MicrophoneIcon', 'SpeakerWaveIcon', 'BellIcon', 'MegaphoneIcon',
        'SignalIcon', 'WifiIcon', 'GlobeAltIcon', 'ShareIcon'
    ],
    'Files & Content': [
        'DocumentIcon', 'DocumentTextIcon', 'ClipboardDocumentIcon', 'FolderIcon', 'FolderOpenIcon',
        'ArchiveBoxIcon', 'InboxIcon', 'PaperClipIcon', 'PhotoIcon', 'FilmIcon',
        'MusicalNoteIcon', 'DocumentArrowDownIcon', 'DocumentArrowUpIcon', 'CloudArrowUpIcon'
    ],
    'Actions': [
        'PlusIcon', 'MinusIcon', 'XMarkIcon', 'CheckIcon', 'PencilIcon', 'TrashIcon',
        'EyeIcon', 'EyeSlashIcon', 'LockClosedIcon', 'LockOpenIcon', 'KeyIcon', 'ShieldCheckIcon',
        'ArrowPathIcon', 'MagnifyingGlassIcon', 'FunnelIcon'
    ],
    'Status & Alerts': [
        'CheckCircleIcon', 'XCircleIcon', 'ExclamationTriangleIcon', 'ExclamationCircleIcon', 'InformationCircleIcon',
        'BellIcon', 'BellAlertIcon', 'FireIcon', 'BoltIcon', 'SparklesIcon',
        'StarIcon', 'HeartIcon', 'FlagIcon'
    ]
};

export default function IconPicker({ isOpen, onClose, onSelectIcon, currentIcon }) {
    const [selectedCategory, setSelectedCategory] = useState('Navigation');

    const handleIconSelect = (iconName) => {
        onSelectIcon(iconName);
        onClose();
    };

    const renderIcon = (iconName) => {
        const IconComponent = HeroIcons[iconName];
        return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="3xl">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <HeroIcons.SwatchIcon className="h-6 w-6 text-purple-600 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">
                            Choose an Icon
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Current Icon */}
                {currentIcon && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center text-sm text-blue-800">
                            <div className="mr-3 text-blue-600">
                                {renderIcon(currentIcon)}
                            </div>
                            <span>Current icon: {currentIcon}</span>
                        </div>
                    </div>
                )}

                {/* Category Tabs */}
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(ICON_CATEGORIES).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Icon Grid */}
                <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-3">
                        {ICON_CATEGORIES[selectedCategory]
                            .filter(iconName => {
                                const exists = !!HeroIcons[iconName];
                                if (!exists) {
                                    console.warn(`Icon "${iconName}" not found in Heroicons and will be filtered out`);
                                }
                                return exists;
                            })
                            .map((iconName) => {
                            const IconComponent = HeroIcons[iconName];
                            
                            return (
                                <button
                                    key={iconName}
                                    onClick={() => handleIconSelect(iconName)}
                                    className={`
                                        p-3 flex flex-col items-center justify-center rounded-lg border
                                        transition-all duration-150 hover:scale-105 hover:shadow-md
                                        ${currentIcon === iconName 
                                            ? 'bg-blue-100 border-blue-400 text-blue-600' 
                                            : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                                        }
                                    `}
                                    title={iconName.replace('Icon', '')}
                                >
                                    <IconComponent className="h-6 w-6 mb-1" />
                                    <span className="text-xs font-medium truncate w-full text-center">
                                        {iconName.replace('Icon', '')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => handleIconSelect('')}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Remove icon
                        </button>
                        <div className="text-xs text-gray-400">
                            {ICON_CATEGORIES[selectedCategory].filter(iconName => !!HeroIcons[iconName]).length} icons in {selectedCategory}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
} 