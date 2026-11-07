# Portfolio Studio

Private GitHub-authenticated editor for ykimran/ykimran.github.io.

- Node 22, Vercel Functions, Auth.js encrypted cookie sessions.
- Only GitHub user ID 85554274 may sign in.
- Publishing writes only index.html on main in the fixed portfolio repository.
- The browser receives no GitHub access token. Drafts remain local; never include credentials in draft data.
- GitHub Pages remains the public website. Vercel deployment protection remains enabled.

## One-time owner setup

Register a GitHub OAuth app with the studio's production origin as homepage and `<production-origin>/api/auth/callback/github` as callback. In Vercel Production environment variables, add AUTH_GITHUB_ID and AUTH_GITHUB_SECRET, then redeploy. Configure APP_ORIGIN to the exact production HTTPS origin. AUTH_SECRET must be a securely generated secret. Never commit secrets.

The OAuth request asks for read:user and public_repo so the owner can publish. All server publishing endpoints still restrict operations to the fixed repository. Cookies are Secure, HttpOnly, and expire after four hours. State, PKCE, and Auth.js CSRF protection protect the login flow; publishing additionally requires a matching Origin header. Missing credentials fail closed.

## Development

Run npm ci and npm test. Tests use synthetic credentials only and do not call GitHub. Production secrets are configured only in Vercel.
