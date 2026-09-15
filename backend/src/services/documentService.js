const { randomUUID } = require('node:crypto');

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async createDocument(file, owner) {
    const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';

    if (!file) {
      throw this.createError('VALIDATION_ERROR', 'O arquivo é obrigatório.');
    }

    if (!normalizedOwner) {
      await this.documentRepository.deleteFile(file.path);
      throw this.createError('VALIDATION_ERROR', 'O proprietário é obrigatório.');
    }

    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      storedName: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      owner: normalizedOwner,
      storagePath: file.path,
    };

    return this.documentRepository.save(document);
  }

  listDocuments() {
    return this.documentRepository.findAll();
  }

  async getDocumentForDownload(id) {
    const document = this.documentRepository.findById(id);

    if (!document) {
      throw this.createError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    if (!(await this.documentRepository.fileExists(document.storagePath))) {
      throw this.createError('FILE_NOT_FOUND', 'Arquivo do documento não encontrado.');
    }

    return document;
  }

  createError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }
}

module.exports = DocumentService;