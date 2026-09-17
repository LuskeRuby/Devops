// Dev-server proxy for `ng serve` (K2).
// BACKEND_URL is set to http://backend:8080 in docker-compose.override.yml.
// Without it, requests go to a backend running on the host.
const target = process.env.BACKEND_URL ?? 'http://localhost:8080';

export default {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
  '/websocket': {
    target: target.replace(/^http/, 'ws'),
    ws: true,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
};
