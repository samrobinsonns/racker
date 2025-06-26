import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Get CSRF token
const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
if (!csrfToken) {
    console.error('CSRF token not found');
} else {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
}

// Configure Pusher for Soketi
window.Pusher = Pusher;

// Enable Pusher logging
window.Pusher.logToConsole = true;

// Configure Laravel Echo with Soketi
window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_SOKETI_APP_KEY,
    wsHost: import.meta.env.VITE_SOKETI_HOST,
    wsPort: import.meta.env.VITE_SOKETI_PORT,
    wssPort: import.meta.env.VITE_SOKETI_PORT,
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    cluster: import.meta.env.VITE_SOKETI_APP_CLUSTER,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    }
});

// Debug Echo connection
window.Echo.connector.pusher.connection.bind('connected', () => {
    console.log('Successfully connected to Soketi');
});

window.Echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('Disconnected from Soketi');
});

window.Echo.connector.pusher.connection.bind('error', (error) => {
    console.error('Soketi connection error:', error);
});
