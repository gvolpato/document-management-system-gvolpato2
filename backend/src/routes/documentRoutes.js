const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: storageDirectory,
  filename: (request, file, callback) => {
    callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
  },
});

function createDocumentRouter(documentController) {
  const router = express.Router();
  const upload = multer({ storage });

  router.post('/upload', upload.single('file'), documentController.upload);
  router.get('/documents', documentController.list);
  router.get('/documents/:id/download', documentController.download);

  return router;
}

module.exports = createDocumentRouter;