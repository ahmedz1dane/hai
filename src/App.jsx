import { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './App.css';

// Dynamically discover all files inside the public folder structure at build time
const publicFiles = import.meta.glob('../public/**/*');

function App() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  
  // Extract clean file paths
  const allFiles = useMemo(() => {
    return Object.keys(publicFiles).map(key => key.replace('../public', ''));
  }, []);

  // State to keep track of selected files
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const toggleSelection = (path) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    if (selectedFiles.size === allFiles.length) {
      setSelectedFiles(new Set()); // Deselect all
    } else {
      setSelectedFiles(new Set(allFiles)); // Select all
    }
  };

  const handleDownloadSelected = async (e) => {
    e.preventDefault();
    if (selectedFiles.size === 0) return;
    if (isDownloading) return;
    
    setIsDownloading(true);
    setProgress('Gathering selected files...');

    try {
      const zip = new JSZip();
      
      for (const path of selectedFiles) {
        setProgress(`Fetching ${path}...`);
        
        // Fetch the file as a Blob using its static path
        const response = await fetch(path);
        if (!response.ok) {
          console.warn(`Failed to fetch ${path}`);
          continue;
        }
        
        const blob = await response.blob();
        
        // Remove the leading slash for the ZIP file structure
        const zipPath = path.startsWith('/') ? path.slice(1) : path;
        zip.file(zipPath, blob);
      }

      setProgress('Compressing into ZIP...');
      const content = await zip.generateAsync({ type: 'blob' });
      
      saveAs(content, 'selected-files.zip');
      setProgress('Download complete!');
      
      setTimeout(() => setProgress(''), 3000);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      setProgress('Error generating ZIP');
      setTimeout(() => setProgress(''), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasSelection = selectedFiles.size > 0;
  const allSelected = selectedFiles.size === allFiles.length && allFiles.length > 0;

  return (
    <div className="app-container">
      <div className="card large-card">
        <h1 className="title">File Explorer</h1>
        <p className="subtitle">
          Select the files you'd like to download. They will be bundled into a secure ZIP.
        </p>
        
        <div className="file-list-header">
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={allSelected} 
              onChange={selectAll}
            />
            <span className="checkmark"></span>
            Select All
          </label>
          <span className="file-count">{allFiles.length} files available</span>
        </div>

        <div className="file-list">
          {allFiles.map(path => (
            <div 
              key={path} 
              className={`file-item ${selectedFiles.has(path) ? 'selected' : ''}`}
              onClick={() => toggleSelection(path)}
            >
              <label 
                className="checkbox-container" 
                onClick={(e) => e.stopPropagation()} // Prevent double trigger
              >
                <input 
                  type="checkbox" 
                  checked={selectedFiles.has(path)} 
                  onChange={() => toggleSelection(path)}
                />
                <span className="checkmark"></span>
              </label>
              <svg className="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="file-name">{path}</span>
            </div>
          ))}
          {allFiles.length === 0 && (
            <div className="empty-state">No files found in the public folder.</div>
          )}
        </div>
        
        <div className="actions">
          <button 
            onClick={handleDownloadSelected} 
            disabled={isDownloading || !hasSelection} 
            className="download-btn"
            style={{ 
              opacity: isDownloading || !hasSelection ? 0.5 : 1,
              cursor: isDownloading ? 'wait' : (!hasSelection ? 'not-allowed' : 'pointer')
            }}
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isDownloading ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              )}
            </svg>
            {isDownloading ? 'Packaging...' : `Download ${selectedFiles.size} File${selectedFiles.size !== 1 ? 's' : ''}`}
          </button>
        </div>

        {progress && (
          <p className="progress-text">{progress}</p>
        )}
      </div>
    </div>
  );
}

export default App;
