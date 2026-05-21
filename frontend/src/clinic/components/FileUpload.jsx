import React, { useRef, useState, useCallback, useMemo } from 'react';

export function FileUploadSection({ patientId, files = [], onUpload, onDelete, onDownload, disabled = false }) {
  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const filesArray = useMemo(() => {
    if (Array.isArray(files)) return files;
    if (files?.files && Array.isArray(files.files)) return files.files;
    return [];
  }, [files]);

  // ── FIX: no setTimeout, no race condition ─────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only images (JPG, PNG, GIF, WebP) and PDFs are allowed.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // onUpload is the parent's handleUploadFile which awaits upload then re-fetches
      await onUpload(patientId, file);
      // Clear input after successful upload
      if (fileInputRef.current)   fileInputRef.current.value   = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await onDownload(patientId, fileId);
      if (!response?.ok) throw new Error('Download failed');
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Downloaded file is empty');
      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download file: ' + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024)           return bytes + ' B';
    if (bytes < 1024 * 1024)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  };

  const btnStyle = (color = '#1565a8') => ({
    display:    'inline-flex',
    alignItems: 'center',
    gap:        6,
    padding:    '6px 14px',
    borderRadius: 8,
    border:     `1.5px solid ${color}`,
    background: 'transparent',
    color,
    fontSize:   12,
    fontWeight: 700,
    cursor:     uploading || disabled ? 'not-allowed' : 'pointer',
    opacity:    uploading || disabled ? 0.6 : 1,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ fontSize: 13 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
          📎 Patient Files ({filesArray.length})
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Upload from device */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            style={{ display: 'none' }}
            id={`file-upload-${patientId}`}
          />
          <label htmlFor={`file-upload-${patientId}`} style={{ cursor: uploading || disabled ? 'not-allowed' : 'pointer' }}>
            <span style={btnStyle('#1565a8')}>
              {uploading ? '⏳ Uploading…' : '📁 Upload File'}
            </span>
          </label>

          {/* Camera — rear camera on mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            style={{ display: 'none' }}
            id={`camera-upload-${patientId}`}
          />
          <label htmlFor={`camera-upload-${patientId}`} style={{ cursor: uploading || disabled ? 'not-allowed' : 'pointer' }}>
            <span style={btnStyle('#00a878')}>
              📷 Use Camera
            </span>
          </label>
        </div>
      </div>

      {/* ── Error ── */}
      {uploadError && (
        <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#c0392b', fontSize: 12 }}>
          ❌ {uploadError}
        </div>
      )}

      {/* ── File list ── */}
      {filesArray.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
          No files uploaded yet
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {filesArray.map((file) => {
            const fileId = file._id;
            return (
              <div key={String(fileId)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{getFileIcon(file.mimeType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.filename || file.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {formatFileSize(file.size)} · {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Just now'} · by {file.uploadedBy || 'staff'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleDownload(fileId, file.filename || file.name)}
                    style={{ background: 'none', border: '1px solid #c5d5e8', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: '#3498db' }}
                    title="Download"
                  >📥</button>
                  <button
                    onClick={() => onDelete(patientId, fileId)}
                    style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: '#e74c3c' }}
                    title="Delete"
                  >🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}