import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

// Formulário de envio de documentos.
export default function UploadComponent({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    if (!owner.trim()) {
      setError('Informe o proprietário do documento.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(file, owner.trim());
      setFile(null);
      setOwner('');
      event.target.reset();
      onUploadSuccess?.();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Enviar documento</h2>
      <div>
        <label htmlFor="owner">Proprietário</label>
        <input
          id="owner"
          type="text"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="file">Arquivo</label>
        <input
          id="file"
          type="file"
          onChange={(event) => setFile(event.target.files[0] ?? null)}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
