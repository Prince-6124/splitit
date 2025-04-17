import React, { useState } from 'react';
import axios from 'axios';

const SplitterForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [length, setLength] = useState(30); // Default clip length is 30 seconds
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a video file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('length', length.toString());

    try {
      const response = await axios.post('http://localhost:4000/splitit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { length },
        responseType: 'blob', // Handle the response as a file (zip)
      });

      const blob = response.data;
      const downloadUrl = window.URL.createObjectURL(blob);
      setDownloadLink(downloadUrl);

    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error processing video');
    }
  };

  return (
    <div>
      <h1>Upload Video to Split</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Video File:</label>
          <input type="file" accept="video/*" onChange={handleFileChange} required />
        </div>

        <div>
          <label>Clip Length (seconds):</label>
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            min="1"
          />
        </div>

        <button type="submit">Upload and Split</button>
      </form>

      {downloadLink && (
        <div>
          <h2>Download Your Video Clips:</h2>
          <a href={downloadLink} download>
            Click here to download the zip file
          </a>
        </div>
      )}
    </div>
  );
};

export default SplitterForm;
