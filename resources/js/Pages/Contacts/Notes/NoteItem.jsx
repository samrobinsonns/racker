import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import InputError from '@/Components/InputError';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

export default function NoteItem({ note, isEditing, onEdit, onUpdate, onDelete }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, patch, delete: destroy, processing, errors } = useForm({
        content: note.content,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('contact.notes.update', note.id), {
            preserveScroll: true,
            onSuccess: (response) => {
                onUpdate(response.note);
            },
        });
    };

    const handleDelete = () => {
        setIsDeleting(true);
        destroy(route('contact.notes.destroy', note.id), {
            preserveScroll: true,
            onSuccess: () => {
                onDelete(note.id);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    if (isEditing) {
        return (
            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Textarea
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={3}
                        />
                        <InputError message={errors.content} />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onUpdate(note)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.content.trim()}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                        Added by {note.user.name}
                    </p>
                    <p className="text-sm text-gray-600">
                        {new Date(note.created_at).toLocaleDateString()}
                        {note.updated_at !== note.created_at && ' (edited)'}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <EllipsisVerticalIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-red-600"
                            disabled={isDeleting}
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="mt-2">
                <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
            </div>
        </Card>
    );
} 