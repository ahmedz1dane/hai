import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Custom plugin to dynamically generate a list of files in the public directory
function publicFilesPlugin() {
  const publicDir = path.resolve(__dirname, 'public');
  const targetFilesDir = path.resolve(__dirname, 'public/files');

  const getAllFiles = (dirPath, arrayOfFiles = []) => {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const absolutePath = path.join(dirPath, file);
      if (fs.statSync(absolutePath).isDirectory()) {
         arrayOfFiles = getAllFiles(absolutePath, arrayOfFiles);
      } else {
         // Convert path to use forward slashes for URLs, relative to the public root
         // so fetching /files/example.zip works perfectly from the client.
         const relativePath = absolutePath.replace(publicDir, '').replace(/\\/g, '/');
         arrayOfFiles.push(relativePath);
      }
    });
    
    return arrayOfFiles;
  };

  return {
    name: 'public-files-manifest',
    // 1. Used during "npm run build" for generating static Vercel output
    buildStart() {
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }
      if (!fs.existsSync(targetFilesDir)) {
        fs.mkdirSync(targetFilesDir);
      }
      
      // We only scan targetFilesDir instead of publicDir
      const files = getAllFiles(targetFilesDir);
      
      // But we still serve files.json from the public root route
      fs.writeFileSync(path.join(publicDir, 'files.json'), JSON.stringify(files, null, 2));
    },
    // 2. Used during "npm run dev" to ALWAYS re-calculate on browser refresh
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/files.json') {
          // We only scan targetFilesDir
          const files = getAllFiles(targetFilesDir);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(files, null, 2));
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), publicFilesPlugin()],
});
