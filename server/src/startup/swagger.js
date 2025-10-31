import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

export default function setupSwagger(app) {
  const spec = swaggerJSDoc({
    definition: { openapi: '3.0.0', info: { title: 'Builtattic API', version: '1.0.0' } },
    apis: ['./src/routes/**/*.js', './src/models/**/*.js']
  });
  // Serve at /docs and /api/docs
  app.use(['/docs', '/api/docs'], swaggerUi.serve, swaggerUi.setup(spec));
}