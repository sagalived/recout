import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const mockApiPlugin = () => ({
  name: 'mock-api',
  configureServer(server: any) {
    let mockState: any = null;
    let mockUpdatedAt = 0;

    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === '/api/state') {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ state: mockState, updatedAt: mockUpdatedAt }));
          return;
        }
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              mockState = payload.state;
              mockUpdatedAt = Date.now();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid payload' }));
            }
          });
          return;
        }
      }
      next();
    });
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), mockApiPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
