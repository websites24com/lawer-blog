'use client';

import { useState } from 'react';

type Props = {
  imageUrl: string;
  onConfirm: (alt: string, title: string) => void;
  onCancel: () => void;
};

export default function ImageMetaModal({ imageUrl, onConfirm, onCancel }: Props) {
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Set Image Metadata</h2>
        <img src={imageUrl} alt="Preview" className="preview-image" />
        <div className="form-group">
          <label htmlFor="alt">Alt Text (for accessibility):</label>
          <input
            id="alt"
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="title">Title (hover tooltip):</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional tooltip on hover"
          />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={() => onConfirm(alt, title)}>Insert Image</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          width: 100%;
          max-width: 500px;
        }
        .preview-image {
          display: block;
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          margin: 1rem 0;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          font-weight: bold;
          margin-bottom: 0.3rem;
        }
        .form-group input {
          width: 100%;
          padding: 0.5rem;
          border-radius: 0.3rem;
          border: 1px solid #ccc;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .modal-actions button {
          padding: 0.5rem 1rem;
        }
      `}</style>
    </div>
  );
}
