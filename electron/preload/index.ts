import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
    version: () => ipcRenderer.invoke("app:version"),
    openExternal: (url: string) => ipcRenderer.invoke("app:open-external", url)
});
