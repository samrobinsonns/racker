import { Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@/Components/ui/pagination';

const TYPE_COLORS = {
    customer: 'bg-blue-100 text-blue-800',
    lead: 'bg-yellow-100 text-yellow-800',
    vendor: 'bg-purple-100 text-purple-800',
    partner: 'bg-green-100 text-green-800',
};

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    archived: 'bg-red-100 text-red-800',
};

export default function ContactList({ contacts }) {
    return (
        <div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tickets</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.data.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">
                                            {contact.first_name} {contact.last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {contact.email}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {contact.company && (
                                        <div>
                                            <div className="font-medium">
                                                {contact.company}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {contact.job_title}
                                            </div>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={TYPE_COLORS[contact.type]}
                                        variant="secondary"
                                    >
                                        {contact.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={STATUS_COLORS[contact.status]}
                                        variant="secondary"
                                    >
                                        {contact.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Link
                                        href={route('contacts.show', contact.id)}
                                        className="text-gray-900 hover:text-gray-700"
                                    >
                                        {contact.tickets_count} tickets
                                    </Link>
                                </TableCell>
                                <TableCell>{contact.notes_count} notes</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                    >
                                        <Link
                                            href={route('contacts.show', contact.id)}
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                    >
                                        <Link
                                            href={route('contacts.edit', contact.id)}
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="py-4 px-6">
                <Pagination links={contacts.links} />
            </div>
        </div>
    );
} 