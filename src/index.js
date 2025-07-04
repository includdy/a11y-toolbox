import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import analyzeRoutes from './routes/analyze.js';

const app = Fastify({ logger: true });

await app.register(swagger, {
  openapi: {
    info: { title: 'Mini Code API', version: '0.1.0' }
  }
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'full' }
});

await app.register(analyzeRoutes, { prefix: '/api' });

const PORT = process.env.PORT || 3000;
app.listen({ port: PORT, host: '0.0.0.0' });
