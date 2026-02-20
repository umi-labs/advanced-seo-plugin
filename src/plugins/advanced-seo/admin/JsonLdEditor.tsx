import React from 'react';

const JsonLdEditor: React.FC<{ value?: any; onChange?: (v: any) => void }> = ({ value, onChange }) => {
  return (
    <textarea
      value={JSON.stringify(value || {}, null, 2)}
      onChange={(e) => {
        try { onChange && onChange(JSON.parse(e.target.value)); } catch (err) { /* ignore */ }
      }}
      style={{ width: '100%', minHeight: 200 }}
    />
  );
};

export default JsonLdEditor;
