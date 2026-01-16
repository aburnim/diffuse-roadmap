import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

// Plugin to handle saving roadmap data to file
function saveRoadmapPlugin(): Plugin {
  return {
    name: 'save-roadmap',
    configureServer(server) {
      server.middlewares.use('/api/save-roadmap', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const filePath = path.resolve(__dirname, 'public/roadmap.json');
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: String(error) }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveRoadmapPlugin()],
  // Base path for GitHub Pages deployment
  // Change this to your repo name if deploying to https://username.github.io/repo-name/
  base: '/diffuse_roadmap',
})
