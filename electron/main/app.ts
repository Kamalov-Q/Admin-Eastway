import { app, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

const ALLOWED_EXTERNAL = new Set<string>([
    "https://admin-dashboard-eastway.vercel.app",
]);

/** Only allow expected in-app navigations */
function isAllowedInAppURL(url: string) {
    if (url.startsWith("file://")) return true;
    if (isDev && url.startsWith("http://localhost:5173")) return true;
    return false;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 640,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.resolve(__dirname, "../preload/index.js"),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            devTools: isDev
        }
    });

    // Debug hooks (remove after things are stable)
    win.webContents.on("did-fail-load", (_e, code, desc, url) => {
        console.error("[did-fail-load]", code, desc, "url:", url);
    });
    win.webContents.on("console-message", (_e, level, message, line, sourceId) => {
        console.log("[console]", level, message, sourceId + ":" + line);
    });
    // if (!isDev) win.webContents.openDevTools({ mode: "detach" });

    win.on("ready-to-show", () => win.show());

    if (isDev) {
        win.loadURL("http://localhost:5173");
    } else {
        // IMPORTANT: packaged path relative to electron-build/main/app.js
        const indexHtml = path.resolve(__dirname, "../../dist/index.html");
        win.loadFile(indexHtml);
    }

    return win;
}

function hardenNavigation() {
    app.on("web-contents-created", (_e, contents) => {
        contents.on("will-navigate", (evt, url) => {
            if (!isAllowedInAppURL(url)) evt.preventDefault();
        });

        contents.setWindowOpenHandler(({ url }) => {
            const allowed = [...ALLOWED_EXTERNAL].some((origin) => url.startsWith(origin));
            if (allowed) shell.openExternal(url);
            return { action: "deny" };
        });

        // Disallow <webview>
        contents.on("will-attach-webview", (e) => e.preventDefault());
    });

    // DO NOT inject a CSP response header for file:// pages.
    // Keep CSP in index.html via <meta http-equiv="Content-Security-Policy"> instead.
}

app.whenReady().then(() => {
    ipcMain.handle("app:version", () => app.getVersion());
    ipcMain.handle("app:open-external", (_e, url: string) => shell.openExternal(url));

    hardenNavigation();

    if (!app.requestSingleInstanceLock()) {
        app.quit();
        return;
    }
    app.on("second-instance", () => {
        const [w] = BrowserWindow.getAllWindows();
        if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
    });

    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
