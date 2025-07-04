import buildServer from './index.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = buildServer();

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() =>
    app.log.info(`🚀 Running on http://localhost:${PORT}/docs`)
  )
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
