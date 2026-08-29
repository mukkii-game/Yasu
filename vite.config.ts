import { defineConfig } from 'vite';

// base is './' so the built bundle works from any sub-path (or file://),
// which keeps the artifact produced by CI portable.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
