import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Custom plugin to dynamically generate a list of files in the public directory
function publicFilesPlugin() {
  return {
    name: 'public-files-manifest',
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      
      // Safety check in case public doesn't exist
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }
      
      const getAllFiles = (dirPath, arrayOfFiles = []) => {
        const files = fs.readdirSync(dirPath);
        
        files.forEach((file) => {
          const absolutePath = path.join(dirPath, file);
          if (fs.statSync(absolutePath).isDirectory()) {
            arrayOfFiles = getAllFiles(absolutePath, arrayOfFiles);
          } else {
            // Exclude the manifest file itself from the list
            if (file !== 'files.json') {
               // Convert path to use forward slashes for URLs
               const relativePath = absolutePath.replace(publicDir, '').replace(/\\/g, '/');
               arrayOfFiles.push(relativePath);
            }
          }
        });
        
        return arrayOfFiles;
      };
      
      const files = getAllFiles(publicDir);
      fs.writeFileSync(path.join(publicDir, 'files.json'), JSON.stringify(files, null, 2));
    }
  };
}

export default defineConfig({
  plugins: [react(), publicFilesPlugin()],
});
