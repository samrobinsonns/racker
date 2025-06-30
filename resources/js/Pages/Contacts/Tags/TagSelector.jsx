import { useState, useEffect } from 'react';
import { Badge } from '@/Components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/Components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function TagSelector({ selectedTags = [], availableTags = [], onChange }) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selected, setSelected] = useState(selectedTags);

    useEffect(() => {
        setSelected(selectedTags);
    }, [selectedTags]);

    const handleSelect = (tag) => {
        const isSelected = selected.some((t) => t.id === tag.id);
        const newSelected = isSelected
            ? selected.filter((t) => t.id !== tag.id)
            : [...selected, tag];
        
        setSelected(newSelected);
        onChange(newSelected);
    };

    const handleRemove = (tagToRemove) => {
        const newSelected = selected.filter((tag) => tag.id !== tagToRemove.id);
        setSelected(newSelected);
        onChange(newSelected);
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="border rounded-md p-2 min-h-[2.5rem] cursor-pointer">
                        {selected.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {selected.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        variant="secondary"
                                        className="pr-6 relative"
                                    >
                                        {tag.name}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(tag);
                                            }}
                                            className="absolute right-1"
                                        >
                                            <XMarkIcon className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">
                                Select tags...
                            </div>
                        )}
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search tags..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                        />
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                            {availableTags.map((tag) => {
                                const isSelected = selected.some((t) => t.id === tag.id);
                                return (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.name}
                                        onSelect={() => handleSelect(tag)}
                                    >
                                        <div className={cn(
                                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                            isSelected ? 'bg-primary border-primary' : 'opacity-50'
                                        )}>
                                            {isSelected && (
                                                <CheckIcon className="h-3 w-3 text-primary-foreground" />
                                            )}
                                        </div>
                                        {tag.name}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
} 