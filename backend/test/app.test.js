const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

async function startTestServer(context) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  return `http://127.0.0.1:${server.address().port}`;
}

async function uploadTestDocument(baseUrl, context, options = {}) {
  const form = new FormData();
  form.append('owner', options.owner || 'user-001');
  form.append(
    'file',
    new Blob([options.content || 'conteúdo do documento'], { type: 'text/plain' }),
    options.filename || 'relatorio.txt',
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  const document = await response.json();
  context.after(() => fs.unlink(document.storagePath).catch(() => {}));

  return { document, response };
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('POST /upload salva o documento e retorna os metadados', async (context) => {
  const baseUrl = await startTestServer(context);
  const { document, response } = await uploadTestDocument(baseUrl, context);

  assert.strictEqual(response.status, 201);
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.owner, 'user-001');
  assert.strictEqual(document.mimeType, 'text/plain');
  assert.ok(document.id);
});

test('POST /upload rejeita documentos sem proprietário', async (context) => {
  const baseUrl = await startTestServer(context);
  const storageDirectory = path.resolve(__dirname, '../storage');
  const filesBeforeInvalidUpload = await fs.readdir(storageDirectory);
  const invalidForm = new FormData();
  invalidForm.append('file', new Blob(['inválido']), 'invalido.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: invalidForm,
  });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(await fs.readdir(storageDirectory), filesBeforeInvalidUpload);
});

test('GET /documents lista os documentos enviados', async (context) => {
  const baseUrl = await startTestServer(context);
  const { document } = await uploadTestDocument(baseUrl, context, {
    filename: 'contrato.txt',
  });

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  const documents = await listResponse.json();
  assert.ok(documents.some((listedDocument) => listedDocument.id === document.id));
});

test('GET /documents/:id/download baixa o conteúdo do documento', async (context) => {
  const baseUrl = await startTestServer(context);
  const { document } = await uploadTestDocument(baseUrl, context);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
  );

  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
  assert.strictEqual(await downloadResponse.text(), 'conteúdo do documento');
});

test('GET /documents/:id/download retorna 404 para documento inexistente', async (context) => {
  const baseUrl = await startTestServer(context);
  const response = await fetch(`${baseUrl}/documents/inexistente/download`);

  assert.strictEqual(response.status, 404);
});
