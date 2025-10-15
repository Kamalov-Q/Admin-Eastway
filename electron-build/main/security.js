import { app, shell, session } from 'electron';
const ALLOWED_EXTERNAL = new Set(['https://admin-dashboard-eastway.vercel.app', 'https://docs.your-domain.com']);
export function harden(sessionPartition = session.defaultSession) {
    app.on('web-contents-created', (_, contents) => {
        contents.on('will-navigate', (e, url) => {
            if (![...ALLOWED_EXTERNAL].some(o => url.startsWith(o)))
                e.preventDefault();
        });
        contents.setWindowOpenHandler(({ url }) => {
            if ([...ALLOWED_EXTERNAL].some(o => url.startsWith(o))) {
                shell.openExternal(url);
                return { action: 'deny' };
            }
            return { action: 'deny' };
        });
    });
    sessionPartition.webRequest.onHeadersReceived((details, cb) => {
        cb({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
                ]
            }
        });
    });
}
//# sourceMappingURL=security.js.map