const { randomUUID } = require('node:crypto');

function createServiceError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeOwner(owner) {
  return typeof owner === 'string' ? owner.trim() : '';
}

function buildDocument(file, owner) {
  return {
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  };
}

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async createDocument(file, owner) {
    if (!file) {
      throw createServiceError('VALIDATION_ERROR', 'O arquivo é obrigatório.');
    }

    const normalizedOwner = normalizeOwner(owner);
    if (!normalizedOwner) {
      await this.documentRepository.deleteFile(file.path);
      throw createServiceError('VALIDATION_ERROR', 'O proprietário é obrigatório.');
    }

    return this.documentRepository.save(buildDocument(file, normalizedOwner));
  }

  listDocuments() {
    return this.documentRepository.findAll();
  }

  async getDocumentForDownload(id) {
    const document = this.documentRepository.findById(id);

    if (!document) {
      throw createServiceError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    if (!(await this.documentRepository.fileExists(document.storagePath))) {
      throw createServiceError('FILE_NOT_FOUND', 'Arquivo do documento não encontrado.');
    }

    return document;
  }
}

module.exports = DocumentService;