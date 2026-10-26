// Archivo aparte (no script inline) para que funcione con una Content-Security-Policy estricta
window.ui = SwaggerUIBundle({
  url: './openapi.yaml',
  dom_id: '#swagger-ui',
  deepLinking: true,
  persistAuthorization: true,
  tryItOutEnabled: true,
});
