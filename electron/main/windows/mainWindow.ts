import { BrowserWindow } from 'electron';
import * as path from 'node:path';
import { isDev } from '../env';


export function createMainWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 640,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.resolve(__dirname, '../preload/index.js'),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            devTools: isDev
        }
    });


    win.on('ready-to-show', () => win.show());


    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.resolve(process.cwd(), 'dist/index.html'));
    }


    return win;
}