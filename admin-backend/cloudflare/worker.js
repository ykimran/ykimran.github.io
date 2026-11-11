import { handle } from '../api/handler.js';
import studioJS from './generated/studio-js.txt';
import studioCSS from './generated/studio-css.txt';

export default {
  async fetch(request, env) {
    try {
      return await handle(request, { env, loadStudio: async () => ({ js: studioJS, css: studioCSS }) });
    } catch (error) {
      console.error('Dashboard request failed:', error.status || 'internal');
      return Response.json({error: error.status ? error.message : 'The dashboard could not complete the request. Your draft is safe.'}, {
        status: error.status || 500,
        headers: { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' },
      });
    }
  },
};
