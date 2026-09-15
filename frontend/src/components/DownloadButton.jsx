import { getDownloadUrl } from '../services/documentApi.js';

// Botão que baixa um documento a partir do seu id.
export default function DownloadButton({ documentId }) {
  return (
    <a href={getDownloadUrl(documentId)} download>
      <button type="button">Baixar</button>
    </a>
  );
}
