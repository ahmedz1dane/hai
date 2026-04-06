import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Custom plugin to dynamically generate a list of files in the public directory
function publicFilesPlugin() {
  const publicDir = path.resolve(__dirname, 'public');

  const getAllFiles = (dirPath, arrayOfFiles = []) => {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const absolutePath = path.join(dirPath, file);
      if (fs.statSync(absolutePath).isDirectory()) {
         arrayOfFiles = getAllFiles(absolutePath, arrayOfFiles);
      } else {
         // Exclude the manifest file itself
         if (file !== 'files.json') {
            const relativePath = absolutePath.replace(publicDir, '').replace(/\\/g, '/');
            arrayOfFiles.push(relativePath);
         }
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
      const files = getAllFiles(publicDir);
      fs.writeFileSync(path.join(publicDir, 'files.json'), JSON.stringify(files, null, 2));
    },
    // 2. Used during "npm run dev" to ALWAYS re-calculate on browser refresh
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Intercept requests to files.json from the React app
        if (req.url === '/files.json') {
          const files = getAllFiles(publicDir);
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
