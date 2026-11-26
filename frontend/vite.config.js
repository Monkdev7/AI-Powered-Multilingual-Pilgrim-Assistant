import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import swPlugin from './pwa/swPlugin.js';

export default defineConfig({
    plugins: [react(), swPlugin()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
});
