import app from './server';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function startDevServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AMPM Sworn Translator] Dev server running on http://localhost:${PORT}`);
  });
}

startDevServer();
