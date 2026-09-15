class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
  }

  upload = async (request, response) => {
    try {
      const document = await this.documentService.createDocument(
        request.file,
        request.body.owner,
      );
      response.status(201).json(document);
    } catch (error) {
      this.handleError(error, response);
    }
  };

  list = (request, response) => {
    try {
      response.json(this.documentService.listDocuments());
    } catch (error) {
      this.handleError(error, response);
    }
  };

  download = async (request, response, next) => {
    try {
      const document = await this.documentService.getDocumentForDownload(request.params.id);
      response.download(document.storagePath, document.originalName, (error) => {
        if (error) {
          next(error);
        }
      });
    } catch (error) {
      this.handleError(error, response);
    }
  };

  handleError(error, response) {
    if (error.code === 'VALIDATION_ERROR') {
      return response.status(400).json({ message: error.message });
    }

    if (error.code === 'DOCUMENT_NOT_FOUND') {
      return response.status(404).json({ message: error.message });
    }

    console.error(error);
    return response.status(500).json({ message: 'Erro interno do servidor.' });
  }
}

module.exports = DocumentController;