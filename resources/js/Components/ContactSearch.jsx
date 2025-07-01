import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { router } from '@inertiajs/react';
import { debounce } from 'lodash';

export default function ContactSearch({ 
    selectedContact, 
    onSelect,
    onClear,
    className = '',
    error = null
}) {
    const [query, setQuery] = useState('');
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Debounced search function
    const searchContacts = debounce(async (searchQuery) => {
        if (!searchQuery?.trim()) {
            setContacts([]);
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch(route('tenant.contacts.search', { 
                query: searchQuery 
            }), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setContacts(data.contacts || []);
        } catch (error) {
            console.error('Error searching contacts:', error);
            setErrorMessage('Failed to search contacts. Please try again.');
            setContacts([]);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    useEffect(() => {
        searchContacts(query);
        return () => searchContacts.cancel();
    }, [query]);

    const handleSelect = (contact) => {
        onSelect(contact);
        setQuery(''); // Reset search query after selection
    };

    return (
        <div className={`${className} space-y-1`}>
            <Combobox value={selectedContact} onChange={handleSelect}>
                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                            displayValue={(contact) => 
                                contact ? `${contact.display_name || contact.name || `${contact.first_name} ${contact.last_name}`} (${contact.email})` : ''
                            }
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search contacts by name or email..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                            {selectedContact && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClear();
                                        setQuery('');
                                    }}
                                    className="mr-1 text-gray-400 hover:text-gray-500"
                                >
                                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            )}
                            <Combobox.Button className="flex items-center">
                                <ChevronUpDownIcon
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                            </Combobox.Button>
                        </div>
                    </div>

                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {isLoading && (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                                Searching...
                            </div>
                        )}

                        {!isLoading && contacts.length === 0 && query !== "" && (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                                No contacts found.
                            </div>
                        )}

                        {contacts.map((contact) => (
                            <Combobox.Option
                                key={contact.id}
                                className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                    }`
                                }
                                value={contact}
                            >
                                {({ selected, active }) => (
                                    <>
                                        <div className="flex flex-col">
                                            <span className={`truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {contact.display_name}
                                            </span>
                                            <span className={`truncate text-sm ${
                                                active ? 'text-indigo-100' : 'text-gray-500'
                                            }`}>
                                                {contact.email}
                                            </span>
                                            {contact.company && (
                                                <span className={`truncate text-sm ${
                                                    active ? 'text-indigo-100' : 'text-gray-400'
                                                }`}>
                                                    {contact.company}
                                                </span>
                                            )}
                                        </div>
                                        {selected ? (
                                            <span
                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                    active ? 'text-white' : 'text-indigo-600'
                                                }`}
                                            >
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </Combobox.Option>
                        ))}
                    </Combobox.Options>
                </div>
            </Combobox>

            {(error || errorMessage) && (
                <p className="text-sm text-red-600">
                    {error || errorMessage}
                </p>
            )}
        </div>
    );
} 