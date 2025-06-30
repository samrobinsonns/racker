import { useState, useRef } from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';

export default function BackgroundImageUploader({ className = '', user }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef();
    const { data, setData } = useForm({
        background_image: null,
    });

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadImage(file);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadImage(file);
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('background_image', file);

        try {
            setUploadProgress(0);
            
            await axios.post(route('profile.background.store'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                },
            });

            // Reset progress after successful upload
            setTimeout(() => setUploadProgress(0), 1000);
            
            // Refresh the page to show the new background
            window.location.reload();
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadProgress(0);
        }
    };

    const deleteBackground = async () => {
        try {
            await axios.delete(route('profile.background.destroy'), {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            
            // Refresh the page to show the changes
            window.location.reload();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className={className}>
            <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                    isDragging ? 'opacity-100' : 'opacity-0'
                } pointer-events-none bg-violet-100/50 z-10 flex items-center justify-center`}
            >
                <div className="text-lg font-medium text-violet-600">
                    Drop image to upload
                </div>
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />

            <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
                {user.background_image_url && (
                    <button
                        onClick={deleteBackground}
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-red-600/50 hover:bg-red-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 backdrop-blur-sm"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove Cover
                    </button>
                )}
                
                <button
                    onClick={triggerFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600/50 hover:bg-violet-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 backdrop-blur-sm"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Cover
                </button>
            </div>

            {uploadProgress > 0 && (
                <div className="absolute bottom-16 right-4 w-48">
                    <div className="bg-white rounded-full h-1.5 mb-1">
                        <div
                            className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-white text-right">{uploadProgress}%</p>
                </div>
            )}
        </div>
    );
} 