// Cliente de API para o backend do Document Management System.
const API_BASE_URL = '/api';

async function parseErrorMessage(response) {
  try {
    const data = await response.json();
    return data.message || 'Erro ao comunicar com o servidor.';
  } catch {
    return 'Erro ao comunicar com o servidor.';
  }
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner', owner);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}

export async function listDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}

export function getDownloadUrl(documentId) {
  return `${API_BASE_URL}/documents/${documentId}/download`;
}
