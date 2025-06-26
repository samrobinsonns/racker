import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import * as HeroIcons from '@heroicons/react/24/outline';

const ICON_CATEGORIES = {
    'Popular': [
        'BuildingOfficeIcon', 'BuildingOffice2Icon', 'HomeIcon', 'ChartBarIcon', 'UsersIcon', 
        'CogIcon', 'DocumentIcon', 'BriefcaseIcon', 'GlobeAltIcon', 'ShieldCheckIcon',
        'CurrencyDollarIcon', 'ChartPieIcon', 'TrendingUpIcon', 'UserGroupIcon', 'ServerIcon'
    ],
    'Buildings & Places': [
        'BuildingOfficeIcon', 'BuildingOffice2Icon', 'BuildingStorefrontIcon', 'BuildingLibraryIcon',
        'HomeIcon', 'HomeModernIcon', 'MapIcon', 'MapPinIcon', 'GlobeAltIcon', 'GlobeAmericasIcon',
        'GlobeAsiaAustraliaIcon', 'GlobeEuropeAfricaIcon', 'FlagIcon', 'BeakerIcon', 'AcademicCapIcon'
    ],
    'Business & Finance': [
        'BriefcaseIcon', 'CurrencyDollarIcon', 'CurrencyEuroIcon', 'CurrencyPoundIcon', 'CurrencyYenIcon',
        'BanknotesIcon', 'CreditCardIcon', 'CalculatorIcon', 'ScaleIcon', 'ReceiptPercentIcon',
        'ReceiptRefundIcon', 'ShoppingBagIcon', 'ShoppingCartIcon', 'TruckIcon', 'ClipboardDocumentCheckIcon',
        'ClipboardDocumentListIcon', 'PresentationChartBarIcon', 'PresentationChartLineIcon'
    ],
    'Analytics & Charts': [
        'ChartBarIcon', 'ChartBarSquareIcon', 'ChartPieIcon', 'PresentationChartBarIcon', 'PresentationChartLineIcon',
        'TrendingUpIcon', 'TrendingDownIcon', 'ArrowTrendingUpIcon', 'ArrowTrendingDownIcon', 'FunnelIcon',
        'TableCellsIcon', 'QueueListIcon', 'ListBulletIcon', 'Squares2X2Icon', 'SquaresPlusIcon'
    ],
    'People & Teams': [
        'UserIcon', 'UsersIcon', 'UserGroupIcon', 'UserCircleIcon', 'UserPlusIcon', 'UserMinusIcon',
        'IdentificationIcon', 'AcademicCapIcon', 'HandRaisedIcon', 'HeartIcon', 'FaceSmileIcon',
        'ChatBubbleLeftRightIcon', 'PhoneIcon', 'EnvelopeIcon', 'AtSymbolIcon', 'MegaphoneIcon', 
        'SpeakerWaveIcon', 'CommandLineIcon'
    ],
    'Technology & Tools': [
        'ComputerDesktopIcon', 'DevicePhoneMobileIcon', 'DeviceTabletIcon', 'ServerIcon', 'CloudIcon', 
        'CloudArrowUpIcon', 'CloudArrowDownIcon', 'WifiIcon', 'CpuChipIcon', 'CommandLineIcon', 
        'CodeBracketIcon', 'CodeBracketSquareIcon', 'BugAntIcon', 'WrenchScrewdriverIcon', 'CogIcon', 
        'Cog6ToothIcon', 'Cog8ToothIcon', 'RocketLaunchIcon', 'CircuitBoardIcon'
    ],
    'Security & Protection': [
        'ShieldCheckIcon', 'ShieldExclamationIcon', 'LockClosedIcon', 'LockOpenIcon', 'KeyIcon',
        'FingerPrintIcon', 'EyeIcon', 'EyeSlashIcon', 'NoSymbolIcon', 'ExclamationTriangleIcon',
        'FireIcon', 'BoltIcon', 'MagnifyingGlassIcon', 'DocumentMagnifyingGlassIcon'
    ],
    'Communication': [
        'ChatBubbleLeftIcon', 'ChatBubbleLeftRightIcon', 'ChatBubbleOvalLeftIcon', 'ChatBubbleOvalLeftEllipsisIcon',
        'EnvelopeIcon', 'EnvelopeOpenIcon', 'InboxIcon', 'InboxArrowDownIcon', 'PhoneIcon', 'DevicePhoneMobileIcon',
        'VideoCameraIcon', 'MicrophoneIcon', 'SpeakerWaveIcon', 'BellIcon', 'BellAlertIcon', 'BellSlashIcon',
        'MegaphoneIcon', 'SignalIcon', 'WifiIcon', 'ShareIcon', 'LinkIcon', 'PaperAirplaneIcon'
    ],
    'Files & Documents': [
        'DocumentIcon', 'DocumentTextIcon', 'DocumentDuplicateIcon', 'DocumentArrowUpIcon', 'DocumentArrowDownIcon',
        'DocumentChartBarIcon', 'DocumentCheckIcon', 'DocumentMinusIcon', 'DocumentPlusIcon', 'ClipboardIcon',
        'ClipboardDocumentIcon', 'ClipboardDocumentCheckIcon', 'ClipboardDocumentListIcon', 'FolderIcon', 
        'FolderOpenIcon', 'FolderPlusIcon', 'FolderMinusIcon', 'ArchiveBoxIcon', 'ArchiveBoxArrowDownIcon',
        'PaperClipIcon', 'BookOpenIcon', 'NewspaperIcon'
    ],
    'Media & Creative': [
        'PhotoIcon', 'CameraIcon', 'FilmIcon', 'VideoCameraIcon', 'VideoCameraSlashIcon', 'PlayIcon',
        'PauseIcon', 'StopIcon', 'SpeakerWaveIcon', 'SpeakerXMarkIcon', 'MusicalNoteIcon', 'MicrophoneIcon',
        'PaintBrushIcon', 'SwatchIcon', 'ColorSwatchIcon', 'SparklesIcon', 'StarIcon', 'SunIcon', 'MoonIcon'
    ],
    'Navigation & Actions': [
        'HomeIcon', 'ArrowRightIcon', 'ArrowLeftIcon', 'ArrowUpIcon', 'ArrowDownIcon', 'ChevronRightIcon', 
        'ChevronLeftIcon', 'ChevronUpIcon', 'ChevronDownIcon', 'ChevronDoubleRightIcon', 'ChevronDoubleLeftIcon',
        'Bars3Icon', 'Bars4Icon', 'EllipsisHorizontalIcon', 'EllipsisVerticalIcon', 'PlusIcon', 'MinusIcon',
        'XMarkIcon', 'CheckIcon', 'PencilIcon', 'PencilSquareIcon', 'TrashIcon', 'ArrowPathIcon'
    ],
    'Status & Indicators': [
        'CheckCircleIcon', 'XCircleIcon', 'ExclamationTriangleIcon', 'ExclamationCircleIcon', 'InformationCircleIcon',
        'QuestionMarkCircleIcon', 'BellIcon', 'BellAlertIcon', 'FireIcon', 'BoltIcon', 'SparklesIcon',
        'StarIcon', 'HeartIcon', 'FlagIcon', 'ClockIcon', 'CalendarIcon', 'CalendarDaysIcon',
        'SignalIcon', 'SignalSlashIcon', 'WifiIcon', 'NoSymbolIcon'
    ]
};

export default function IconPicker({ isOpen, onClose, onSelectIcon, currentIcon }) {
    const [selectedCategory, setSelectedCategory] = useState('Popular');

    const handleIconSelect = (iconName) => {
        onSelectIcon(iconName);
        onClose();
    };

    const renderIcon = (iconName) => {
        const IconComponent = HeroIcons[iconName];
        return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
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
                            <span>Current icon: <strong>{currentIcon.replace('Icon', '')}</strong></span>
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
                    <div className="grid grid-cols-8 gap-2">
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
                                        p-2 flex flex-col items-center justify-center rounded-lg border
                                        transition-all duration-150 hover:scale-105 hover:shadow-md
                                        ${currentIcon === iconName 
                                            ? 'bg-blue-100 border-blue-400 text-blue-600' 
                                            : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                                        }
                                    `}
                                    title={iconName.replace('Icon', '')}
                                >
                                    <IconComponent className="h-5 w-5 mb-1" />
                                    <span className="text-[10px] font-medium truncate w-full text-center leading-tight">
                                        {iconName.replace('Icon', '').replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search Tip */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                        <HeroIcons.LightBulbIcon className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-600">
                            <strong>Tip:</strong> Can't find what you're looking for? Try the "{selectedCategory === 'Popular' ? 'Buildings & Places' : 'Popular'}" category or browse through the other categories for more options.
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
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