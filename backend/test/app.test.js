const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('permite enviar, listar e baixar documentos', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const form = new FormData();
  form.append('owner', 'user-001');
  form.append('file', new Blob(['conteúdo do documento'], { type: 'text/plain' }), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.strictEqual(uploadResponse.status, 201);

  const uploadedDocument = await uploadResponse.json();
  context.after(() => fs.unlink(uploadedDocument.storagePath).catch(() => {}));
  assert.strictEqual(uploadedDocument.originalName, 'relatorio.txt');
  assert.strictEqual(uploadedDocument.owner, 'user-001');
  assert.strictEqual(uploadedDocument.mimeType, 'text/plain');
  assert.ok(uploadedDocument.id);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  const documents = await listResponse.json();
  assert.ok(documents.some((document) => document.id === uploadedDocument.id));

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
  );
  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
  assert.strictEqual(await downloadResponse.text(), 'conteúdo do documento');

  const notFoundResponse = await fetch(`${baseUrl}/documents/inexistente/download`);
  assert.strictEqual(notFoundResponse.status, 404);

  const storageDirectory = path.resolve(__dirname, '../storage');
  const filesBeforeInvalidUpload = await fs.readdir(storageDirectory);
  const invalidForm = new FormData();
  invalidForm.append('file', new Blob(['inválido']), 'invalido.txt');
  const invalidResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: invalidForm,
  });
  assert.strictEqual(invalidResponse.status, 400);
  assert.deepStrictEqual(await fs.readdir(storageDirectory), filesBeforeInvalidUpload);
});
