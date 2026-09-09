import { defineConfig, loadEnv } from 'vite'
import { assertPublicEnvSafe } from './scripts/check-public-env.mjs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  assertPublicEnvSafe(env);
  const production = command === 'build' && mode === 'production';
  if (production) {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Production requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
    }
    if (new URL(env.VITE_SUPABASE_URL).protocol !== 'https:') {
      throw new Error('Production requires an HTTPS Supabase URL.');
    }
  }
  // Keep legacy adapters for development/explicit rollback builds, but never
  // embed their local API addresses or Firebase configuration in production.
  const legacyEnvKeys = [
    'VITE_API_BASE_URL', 'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
  ];
  return {
    define: production
      ? Object.fromEntries(legacyEnvKeys.map(key => [`import.meta.env.${key}`, 'undefined']))
      : {},
    plugins: [
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
