const fs = require('node:fs/promises');

class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findAll() {
    return Array.from(this.documents.values());
  }

  findById(id) {
    return this.documents.get(id) || null;
  }

  async fileExists(storagePath) {
    try {
      await fs.access(storagePath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(storagePath) {
    await fs.unlink(storagePath).catch(() => {});
  }
}

module.exports = DocumentRepository;