import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Card } from '@/Components/ui/card';
import InputError from '@/Components/InputError';
import NoteItem from './NoteItem';

export default function NotesSection({ contact, notes: initialNotes }) {
    const [notes, setNotes] = useState(initialNotes);
    const [editingNoteId, setEditingNoteId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        content: '',
        contact_id: contact.id,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('contact.notes.store'), {
            preserveScroll: true,
            onSuccess: (response) => {
                setNotes([response.note, ...notes]);
                reset('content');
            },
        });
    };

    const handleEdit = (noteId) => {
        setEditingNoteId(noteId);
    };

    const handleUpdate = (note) => {
        setNotes(notes.map((n) => (n.id === note.id ? note : n)));
        setEditingNoteId(null);
    };

    const handleDelete = (noteId) => {
        setNotes(notes.filter((note) => note.id !== noteId));
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Textarea
                            placeholder="Add a note..."
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={3}
                        />
                        <InputError message={errors.content} />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={processing || !data.content.trim()}
                        >
                            Add Note
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="space-y-4">
                {notes.map((note) => (
                    <NoteItem
                        key={note.id}
                        note={note}
                        isEditing={editingNoteId === note.id}
                        onEdit={() => handleEdit(note.id)}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                ))}
                {notes.length === 0 && (
                    <div className="text-center text-gray-500 py-6">
                        No notes yet
                    </div>
                )}
            </div>
        </div>
    );
} 