import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    https: {
      key: fs.readFileSync('server.key'),
      cert: fs.readFileSync('server.crt'),
    },
    port: 5173, // Your frontend port
  },
})
