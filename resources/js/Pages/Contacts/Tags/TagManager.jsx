import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import InputError from '@/Components/InputError';

export default function TagManager({ tags: initialTags }) {
    const [tags, setTags] = useState(initialTags);
    const [editingTagId, setEditingTagId] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('contact-tags.store'), {
            preserveScroll: true,
            onSuccess: (response) => {
                setTags([response.tag, ...tags]);
                reset('name');
            },
        });
    };

    const handleUpdate = (tagId) => {
        patch(route('contact-tags.update', tagId), {
            preserveScroll: true,
            onSuccess: (response) => {
                setTags(tags.map((tag) => (tag.id === tagId ? response.tag : tag)));
                setEditingTagId(null);
                reset('name');
            },
        });
    };

    const handleDelete = (tagId) => {
        if (!confirm('Are you sure you want to delete this tag?')) return;

        destroy(route('contact-tags.destroy', tagId), {
            preserveScroll: true,
            onSuccess: () => {
                setTags(tags.filter((tag) => tag.id !== tagId));
            },
        });
    };

    const startEditing = (tag) => {
        setEditingTagId(tag.id);
        setData('name', tag.name);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Tags</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Enter tag name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            <InputError message={errors.name} />
                        </div>
                        <Button
                            type="submit"
                            disabled={processing || !data.name.trim()}
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Tag
                        </Button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <div
                                key={tag.id}
                                className="group relative inline-flex items-center"
                            >
                                {editingTagId === tag.id ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="h-8 w-32"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleUpdate(tag.id)}
                                            disabled={processing || !data.name.trim()}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingTagId(null);
                                                reset('name');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="pr-8 cursor-pointer"
                                        onClick={() => startEditing(tag)}
                                    >
                                        {tag.name}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(tag.id);
                                            }}
                                            className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
 