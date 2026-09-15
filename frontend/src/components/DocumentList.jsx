import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

// Lista os documentos disponíveis, permitindo o download de cada um.
export default function DocumentList({ documents, isLoading, error }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (documents.length === 0) {
    return <p>Nenhum documento enviado ainda.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Proprietário</th>
          <th>Tamanho</th>
          <th>Enviado em</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id}>
            <td>{document.originalName}</td>
            <td>{document.owner}</td>
            <td>{formatSize(document.size)}</td>
            <td>{new Date(document.uploadedAt).toLocaleString('pt-BR')}</td>
            <td>
              <DownloadButton documentId={document.id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
