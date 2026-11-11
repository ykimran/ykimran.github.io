# Cloudflare dashboard alongside Vercel

The Cloudflare Worker and Vercel Function share `api/handler.js` and the original
`private/studio.js` / `private/studio.css`. No token is embedded in public files.
Each host has separate encrypted sessions and a separate GitHub OAuth app.
Publishing on either host updates `ykimran/ykimran.github.io` on `main`.
The editor's existing baseline check and GitHub blob SHA protect against stale writes.

## Cloudflare deployment

1. Connect the repository to Workers Builds, using the prepared branch until setup
   is verified, root directory `admin-backend`, build command `npm test`, and deploy
   command `npm run cloudflare:deploy`.
2. A first deployment without secrets can show only the setup page; the editor and
   publishing routes fail closed. Record the actual assigned HTTPS Worker origin.
3. Register a **new** GitHub OAuth app, keeping the Vercel app unchanged. Set its
   homepage to that origin and callback to `/api/auth/callback/github` on it.
4. Set `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and an independent random
   `AUTH_SECRET` as encrypted Worker secrets. Set `APP_ORIGIN` to that exact HTTPS
   origin, with no path. Do not commit these values or copy Vercel session secrets.
5. Verify owner login, non-owner rejection, editor loading, and session sign-out.
6. Put the verified `/admin` URL in `/edit/hosts.json` under `cloudflare`, then merge
   the prepared branch. `https://ykimran.github.io/?edit` opens the host chooser.

Vercel deployment protection does not transfer to Cloudflare. The Worker itself
requires GitHub owner ID `85554274` for every editor/content request. An optional
extra Cloudflare Access gate can be configured separately if desired.

`npm run cloudflare:check` builds the deployment without publishing. The build
copies the shared editor assets into ignored `cloudflare/generated/` text modules;
the protected Worker bundles them rather than serving a public assets folder.

The existing offline dashboard remains separate and works as before. This change
does not modify the editor UI or its data format, so no new offline mirror is needed.
