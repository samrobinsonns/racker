import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export default function AvatarUploader({ user = {}, className = '' }) {
    const fileInput = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&color=7F9CF5&background=EBF4FF`;

    const handleUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            await axios.post(route('profile.avatar.store'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });

            window.location.reload();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleRemoveAvatar = (e) => {
        e.stopPropagation();
        axios.delete(route('profile.avatar.destroy'), {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            }
        }).then(() => {
            window.location.reload();
        });
    };

    return (
        <div 
            className={`relative group cursor-pointer ${className}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInput.current?.click()}
        >
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
            />

            {/* Avatar Image */}
            <img
                src={user.avatar_url || defaultAvatarUrl}
                alt={user.name || 'User'}
                className="h-full w-full rounded-full object-cover"
            />

            {/* Camera Icon Overlay */}
            <div className={`
                absolute inset-0 flex items-center justify-center rounded-full
                bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-40
                ${isDragging ? 'opacity-100' : ''}
            `}>
                <svg 
                    className="h-8 w-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="1.5" 
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="1.5" 
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            </div>

            {/* Upload Progress Indicator */}
            {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 z-40">
                    <div className="relative w-12 h-12">
                        <svg 
                            className="animate-spin h-12 w-12 text-purple-500" 
                            viewBox="0 0 24 24"
                        >
                            <circle 
                                className="opacity-25" 
                                cx="12" 
                                cy="12" 
                                r="10" 
                                stroke="currentColor" 
                                strokeWidth="4"
                            />
                            <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                                {uploadProgress}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Avatar Button */}
            {user.avatar_url && (
                <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute bottom-0 right-0 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform translate-x-1/4 translate-y-1/4 z-40"
                >
                    <svg 
                        className="h-4 w-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
} 