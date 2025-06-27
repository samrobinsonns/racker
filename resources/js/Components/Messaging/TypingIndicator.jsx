import React from 'react';

export default function TypingIndicator({ users }) {
    if (users.length === 0) return null;

    const getUserNames = () => {
        if (users.length === 1) {
            return `${users[0].name} is typing`;
        } else if (users.length === 2) {
            return `${users[0].name} and ${users[1].name} are typing`;
        } else {
            return `${users[0].name} and ${users.length - 1} other${users.length - 1 !== 1 ? 's' : ''} are typing`;
        }
    };

    return (
        <div className="flex justify-start">
            <div className="flex items-center space-x-2">
                {/* Avatar for single user */}
                {users.length === 1 && (
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">
                            {users[0].name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    </div>
                )}

                {/* Typing bubble */}
                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                    <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">
                            {getUserNames()}
                        </span>
                        <div className="flex space-x-1 ml-2">
                            <div className="typing-dot bg-gray-400"></div>
                            <div className="typing-dot bg-gray-400"></div>
                            <div className="typing-dot bg-gray-400"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 