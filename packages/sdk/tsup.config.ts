import { defineConfig } from 'tsup';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Entry point
  entry: ['src/index.ts'],
  
  // Output formats - added 'iife' for browser global
  format: ['esm', 'cjs', 'iife'],
  
  // Generate TypeScript declaration files
  dts: true,
  
  // Split output into chunks for better tree-shaking (disabled for IIFE)
  splitting: false,
  
  // Generate sourcemaps
  sourcemap: true,
  
  // Clean output directory before build
  clean: true,
  
  // Minify output
  minify: false,
  
  // Target environment
  target: 'es2020',
  
  // External dependencies (don't bundle these)
  external: [],
  
  // Output directory
  outDir: 'dist',
  
  // Enable tree-shaking
  treeshake: true,
  
  // Platform
  platform: 'browser',
  
  // Shims for Node.js globals in browser
  shims: false,
  
  // Bundle all dependencies
  noExternal: [],
});
