import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';

const CONTACT_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'customer', label: 'Customer' },
    { value: 'lead', label: 'Lead' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'partner', label: 'Partner' },
];

const CONTACT_STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
];

export default function ContactFilters({ filters, onChange }) {
    const handleTypeChange = (value) => {
        onChange({ ...filters, type: value });
    };

    const handleStatusChange = (value) => {
        onChange({ ...filters, status: value });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filters.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-[160px] bg-white">
                    <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                    {CONTACT_TYPES.map((type) => (
                        <SelectItem 
                            key={type.value} 
                            value={type.value}
                            className="cursor-pointer"
                        >
                            {type.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[160px] bg-white">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {CONTACT_STATUSES.map((status) => (
                        <SelectItem 
                            key={status.value} 
                            value={status.value}
                            className="cursor-pointer"
                        >
                            {status.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
} 