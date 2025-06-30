import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { router } from '@inertiajs/react';
import { debounce } from 'lodash';

export default function ContactSelector({ selectedContact, onSelect, className = '' }) {
    const [query, setQuery] = useState('');
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const searchContacts = debounce(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setContacts([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/tenant/contacts/search?query=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setContacts(data.contacts);
        } catch (error) {
            console.error('Error searching contacts:', error);
            setContacts([]);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    useEffect(() => {
        searchContacts(query);
    }, [query]);

    return (
        <Combobox value={selectedContact} onChange={onSelect}>
            <div className={`relative mt-1 ${className}`}>
                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                    <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                        displayValue={(contact) => contact?.email || ''}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search contacts..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </Combobox.Button>
                </div>
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                    {isLoading ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Loading...
                        </div>
                    ) : contacts.length === 0 && query !== "" ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No contacts found.
                        </div>
                    ) : (
                        contacts.map((contact) => (
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
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {contact.first_name} {contact.last_name} ({contact.email})
                                        </span>
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
                        ))
                    )}
                </Combobox.Options>
            </div>
        </Combobox>
    );
} 