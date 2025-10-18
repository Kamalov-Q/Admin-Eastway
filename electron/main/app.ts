import { app, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "node:path";
import * as fs from "node:fs";

const isDev = process.env.NODE_ENV === "development";

const ALLOWED_EXTERNAL = new Set<string>([
    "https://admin-dashboard-eastway.vercel.app",
]);

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
            devTools: isDev,
        },
    });

    win.on("ready-to-show", () => win.show());

    win.webContents.on("did-fail-load", (_e, code, desc, url) => {
        console.error("[did-fail-load]", code, desc, "url:", url);
    });

    if (isDev) {
        win.loadURL("http://localhost:5173");
    } else {
        const indexHtml = path.join(process.resourcesPath, "dist", "index.html");
        console.log("[loadFile]", indexHtml, fs.existsSync(indexHtml) ? "(exists)" : "(MISSING)");
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
            const allowed = [...ALLOWED_EXTERNAL].some((o) => url.startsWith(o));
            if (allowed) shell.openExternal(url);
            return { action: "deny" };
        });
        contents.on("will-attach-webview", (e) => e.preventDefault());
    });
}

app.whenReady().then(() => {
    ipcMain.handle("app:version", () => app.getVersion());
    ipcMain.handle("app:open-external", (_e, url: string) => shell.openExternal(url));

    hardenNavigation();

    if (!app.requestSingleInstanceLock()) { app.quit(); return; }
    app.on("second-instance", () => {
        const [w] = BrowserWindow.getAllWindows();
        if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
    });

    createWindow();
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
