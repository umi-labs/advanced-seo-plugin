import React from 'react';

const PreviewPanel: React.FC<{ title?: string; description?: string; image?: string }> = ({ title, description, image }) => {
  return (
    <div style={{ padding: 12, border: '1px solid #eee' }}>
      <h3>Preview</h3>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ color: '#666' }}>{description}</div>
      {image && <img src={image} alt="preview" style={{ maxWidth: '100%', marginTop: 8 }} />}
    </div>
  );
};

export default PreviewPanel;
