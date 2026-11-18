import { useState, useRef } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Tab = 'compress' | 'upscale';

interface ProcessResult {
  originalName: string;
  processedName: string;
  size: number;
  downloadUrl: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('compress');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessResult | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [scale, setScale] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClickBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    setUploadedFile(file);
    setError(null);
    setProcessedResult(null);
    setProcessedPreview(null);
    const url = URL.createObjectURL(file);
    setOriginalPreview(url);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    setUploadedFile(file);
    setError(null);
    setProcessedResult(null);
    setProcessedPreview(null);
    const url = URL.createObjectURL(file);
    setOriginalPreview(url);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processImage = async (endpoint: 'compress' | 'upscale') => {
    if (!uploadedFile) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', uploadedFile);
    if (endpoint === 'compress') {
      formData.append('quality', quality.toString());
    } else {
      formData.append('scale', scale.toString());
    }
    try {
      const response = await fetch(`${API_URL}/images/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${endpoint} image`);
      }
      const result: ProcessResult = await response.json();
      setProcessedResult(result);
      const imgResponse = await fetch(`${API_URL}${result.downloadUrl}`);
      const imgBlob = await imgResponse.blob();
      const imgUrl = URL.createObjectURL(imgBlob);
      setProcessedPreview(imgUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!processedResult) return;
    const link = document.createElement('a');
    link.href = `${API_URL}${processedResult.downloadUrl}`;
    link.download = processedResult.processedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderControls = () => {
    if (activeTab === 'compress') {
      return (
        <div className="control-group">
          <label>Compression Quality:</label>
          <input
            type="range"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value, 10))}
          />
          <span>{quality}%</span>
        </div>
      );
    }
    return (
      <div className="control-group">
        <label>Upscale Factor:</label>
        <select
          value={scale}
          onChange={(e) => setScale(parseInt(e.target.value, 10))}
        >
          <option value={2}>2x</option>
          <option value={3}>3x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🖼️ Image Processor</h1>
        <p>Compress large images or upscale small images to HD</p>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={() => setActiveTab('compress')}
        >
          📉 Compress Image
        </button>
        <button
          className={`tab-btn ${activeTab === 'upscale' ? 'active' : ''}`}
          onClick={() => setActiveTab('upscale')}
        >
          🔍 Upscale to HD
        </button>
      </div>

      <div className="container">
        <div className="upload-section">
          <h2>{activeTab === 'compress' ? 'Compress Image' : 'Upscale Image'}</h2>

          <div
            className={`drop-zone ${uploadedFile ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleClickBrowse}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
            <p>
              {uploadedFile ? (
                `Selected: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`
              ) : (
                'Drag & drop an image here, or click to browse'
              )}
            </p>
          </div>

          {renderControls()}

          {error && <div className="error-message">{error}</div>}

          <button
            className="process-btn"
            onClick={() => processImage(activeTab)}
            disabled={loading || !uploadedFile}
          >
            {loading ? 'Processing...' : `Start ${activeTab === 'compress' ? 'Compression' : 'Upscaling'}`}
          </button>
        </div>

        <div className="result-section">
          {originalPreview && (
            <div className="image-preview">
              <h3>Original</h3>
              <img src={originalPreview} alt="Original" className="preview-img" />
              <p>Size: {uploadedFile ? (uploadedFile.size / 1024).toFixed(1) : '0'} KB</p>
            </div>
          )}

          {processedPreview && processedResult && (
            <div className="image-preview">
              <h3>Processed</h3>
              <img src={processedPreview} alt="Processed" className="preview-img" />
              <p>Size: {(processedResult.size / 1024).toFixed(1)} KB</p>
              <button className="download-btn" onClick={downloadImage}>
                ⬇️ Download Processed Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;