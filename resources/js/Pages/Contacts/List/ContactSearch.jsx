import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/Components/ui/input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

export default function ContactSearch({ value, onChange }) {
    const [searchTerm, setSearchTerm] = useState(value);

    // Debounce the onChange callback
    const debouncedOnChange = useCallback(
        debounce((value) => {
            onChange(value);
        }, 300),
        [onChange]
    );

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        debouncedOnChange(newValue);
    };

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleChange}
                className="pl-10"
            />
        </div>
    );
} 