import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function buildServer() {
  const app = Fastify({ logger: true });

  // Add content type parsers for text/html and text/plain
  app.addContentTypeParser('text/html', { parseAs: 'string' }, (req, body, done) => {
    done(null, body);
  });

  app.addContentTypeParser('text/plain', { parseAs: 'string' }, (req, body, done) => {
    done(null, body);
  });

  // Swagger / OpenAPI
  app.register(swagger, {
    openapi: {
      info: { title: 'A11Y Toolbox API', version: '0.1.0' }
    }
  });
  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'full' }
  });

  // Charge automatiquement tous les *.route.ts
  app.register(autoload, {
    dir: join(__dirname, 'api'),
    forceESM: true,                 // car on est en ESM
    indexPattern: /.*\.route\.[tj]s$/
  });

  return app;
}

export default buildServer;
