/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    css: true,
    includeSource: ['src/**/*.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        'dist/',
        'build/'
      ],
      thresholds: {
        global: {
          functions: 80,
          lines: 80,
          statements: 80,
          branches: 70
        },
        'src/services/': {
          functions: 90,
          lines: 90,
          statements: 90,
          branches: 80
        },
        'src/components/': {
          functions: 75,
          lines: 75,
          statements: 75,
          branches: 65
        },
        'src/store/': {
          functions: 85,
          lines: 85,
          statements: 85,
          branches: 75
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    __TEST__: true
  }
})