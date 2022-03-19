import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";

let win: BrowserWindow | null = null;

async function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    if (isDev) {
        win.loadURL("http://localhost:3000/index.html");
    } else {
        win.loadURL(`file://${__dirname}/../index.html`);
    }

    win.on("closed", () => (win = null));

    // Hot Reloading
    if (isDev) {
        const electronPath = path.join(
            __dirname,
            "..",
            "..",
            "node_modules",
            "electron",
            "dist",
            "electron"
        );
        require("electron-reload")(__dirname, {
            electron: electronPath,
            forceHardReset: true,
            hardResetMethod: "exit",
        });
    }

    // DevTools
    if (isDev) {
        try {
            const {
                default: installExtension,
                REACT_DEVELOPER_TOOLS,
                REDUX_DEVTOOLS,
            } = await import("electron-devtools-installer");
            await installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS]);
        } catch (err) {
            console.error({ err });
        }

        win.webContents.openDevTools();
    }
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (win === null) {
        createWindow();
    }
});
