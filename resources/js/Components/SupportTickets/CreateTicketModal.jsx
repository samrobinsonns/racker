import React, { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function CreateTicketModal({ show, onClose, onCreate }) {
    const [loading, setLoading] = useState(false);
    const [priorities, setPriorities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        subject: '',
        description: '',
        priority_id: '',
        category_id: '',
        attachments: [],
    });

    useEffect(() => {
        if (show) {
            fetchFormOptions();
        }
    }, [show]);

    const fetchFormOptions = async () => {
        try {
            const [prioritiesRes, categoriesRes] = await Promise.all([
                fetch('/api/support-tickets/priorities'),
                fetch('/api/support-tickets/categories'),
            ]);

            const [
                { priorities: fetchedPriorities },
                { categories: fetchedCategories },
            ] = await Promise.all([
                prioritiesRes.json(),
                categoriesRes.json(),
            ]);

            setPriorities(fetchedPriorities);
            setCategories(fetchedCategories);
        } catch (error) {
            console.error('Error fetching form options:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Create FormData for file uploads
            const formData = new FormData();
            formData.append('subject', form.subject);
            formData.append('description', form.description);
            formData.append('priority_id', form.priority_id);
            if (form.category_id) {
                formData.append('category_id', form.category_id);
            }
            
            // Append each file
            Array.from(form.attachments).forEach(file => {
                formData.append('attachments[]', file);
            });

            await onCreate(formData);
            handleClose();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({
            subject: '',
            description: '',
            priority_id: '',
            category_id: '',
            attachments: [],
        });
        setErrors({});
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">
                    Create New Support Ticket
                </h2>

                {/* Subject */}
                <div className="mb-4">
                    <InputLabel htmlFor="subject" value="Subject" />
                    <TextInput
                        id="subject"
                        type="text"
                        className="mt-1 block w-full"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        required
                    />
                    <InputError message={errors.subject} className="mt-2" />
                </div>

                {/* Description */}
                <div className="mb-4">
                    <InputLabel htmlFor="description" value="Description" />
                    <textarea
                        id="description"
                        className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                        rows="4"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        required
                    />
                    <InputError message={errors.description} className="mt-2" />
                </div>

                {/* Priority */}
                <div className="mb-4">
                    <InputLabel htmlFor="priority" value="Priority" />
                    <select
                        id="priority"
                        className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                        value={form.priority_id}
                        onChange={(e) => setForm({ ...form, priority_id: e.target.value })}
                        required
                    >
                        <option value="">Select Priority</option>
                        {priorities.map((priority) => (
                            <option key={priority.id} value={priority.id}>
                                {priority.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.priority_id} className="mt-2" />
                </div>

                {/* Category */}
                <div className="mb-4">
                    <InputLabel htmlFor="category" value="Category" />
                    <select
                        id="category"
                        className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                        value={form.category_id}
                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.category_id} className="mt-2" />
                </div>

                {/* File Attachments */}
                <div className="mb-6">
                    <InputLabel htmlFor="attachments" value="Attachments" />
                    <input
                        id="attachments"
                        type="file"
                        className="mt-1 block w-full"
                        onChange={(e) => setForm({ ...form, attachments: e.target.files })}
                        multiple
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        Max file size: 10MB. Allowed types: Images, PDF, Word, Excel, Text
                    </p>
                    <InputError message={errors.attachments} className="mt-2" />
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                    <SecondaryButton onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Ticket'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
} 