const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:4001';

module.exports = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
