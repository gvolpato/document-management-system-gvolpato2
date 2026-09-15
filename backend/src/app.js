const express = require('express');
const DocumentController = require('./controllers/documentController');
const DocumentRepository = require('./repositories/documentRepository');
const createDocumentRouter = require('./routes/documentRoutes');
const DocumentService = require('./services/documentService');

const app = express();
const PORT = process.env.PORT || 3000;

const documentRepository = new DocumentRepository();
const documentService = new DocumentService(documentRepository);
const documentController = new DocumentController(documentService);

app.use(express.json());
app.use(createDocumentRouter(documentController));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof require('multer').MulterError) {
    return response.status(400).json({ message: 'Não foi possível processar o arquivo.' });
  }

  return response.status(500).json({ message: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
