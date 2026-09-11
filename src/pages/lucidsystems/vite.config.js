import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      // Specific component overrides - must come BEFORE general @/components
      '@/components/AuthLayout': path.resolve(__dirname, './components/AuthLayout.jsx'),
      '@/components/GoogleIcon': path.resolve(__dirname, './components/GoogleIcon.jsx'),
      '@/components/UserNotRegisteredError': path.resolve(__dirname, './components/UserNotRegisteredError.jsx'),
      '@/components/ui/use-toast': path.resolve(__dirname, './components/ui/use-toast.jsx'),
      '@/components/ui/toast': path.resolve(__dirname, './components/ui/toast.jsx'),
      '@/components/ui/input-otp': path.resolve(__dirname, './components/ui/input-otp.jsx'),
      '@/components/ui/button': path.resolve(__dirname, './components/ui/button.jsx'),
      '@/components/ui/input': path.resolve(__dirname, './components/ui/input.jsx'),
      '@/components/ui/label': path.resolve(__dirname, './components/ui/label.jsx'),
      '@/components/ui/badge': path.resolve(__dirname, './components/ui/badge.jsx'),
      '@/components/ui/progress': path.resolve(__dirname, './components/ui/progress.jsx'),
      '@/lib/logActivity': path.resolve(__dirname, './lib/logActivity.js'),
      // General aliases - must come AFTER specific overrides
      '@': path.resolve(__dirname, '../../src'),
      '~': path.resolve(__dirname, '../..'),
      '@/components': path.resolve(__dirname, '../../components'),
      '@/lib': path.resolve(__dirname, '../lib'),
    },
  },
});
