import { session, app, BrowserWindow } from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";
import * as os from "os";
import * as fs from "fs";
import { Extension } from "electron/main";

const EXTENSIONS_PATH: string | undefined = (() => {
  let chromePath = os.homedir();
  switch (os.platform()) {
    case "win32":
      chromePath = path.join(
        chromePath,
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "User Data"
      );
      break;
    case "darwin":
      chromePath = path.join(
        chromePath,
        "Library",
        "Application Support",
        "Google",
        "Chrome"
      );
      break;
    case "linux":
      chromePath = path.join(chromePath, ".config", "google-chrome");
      break;
    default:
      return;
  }
  return path.join(chromePath, "Default", "Extensions");
})();

type ExtensionEntry = {
  name: string;
  path: string | undefined;
};

const REDUX_DEVTOOLS: ExtensionEntry = {
  path:
    EXTENSIONS_PATH &&
    path.join(EXTENSIONS_PATH, "lmhkpmbekcpmknklioeibfkpmmfibljd"),
  name: "redux devtools",
};
const REACT_DEVELOPER_TOOLS: ExtensionEntry = {
  path:
    EXTENSIONS_PATH &&
    path.join(EXTENSIONS_PATH, "fmkadmapgofadopljbjfkapdkoienihi"),
  name: "react developer tools",
};

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
    // 'build/index.html'
    win.loadURL(`file://${__dirname}/../index.html`);
  }

  win.on("closed", () => (win = null));

  // Hot Reloading
  if (isDev) {
    // 'node_modules/.bin/electronPath'
    const electronPath = path.join(
      __dirname,
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
      await Promise.all(
        [REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS]
          .filter((entry) => typeof entry.path !== "undefined")
          .map(async (entry) => {
            const versionDirectories = fs
              .readdirSync(entry.path!!, { withFileTypes: true })
              .filter((dirent) => dirent.isDirectory())
              .map((dirent) => dirent.name);
            let extensionPath;
            if (versionDirectories.length === 0) {
              console.error(
                `No available versions found for \`${entry.name}\``
              );
              return;
            } else {
              extensionPath = path.join(entry.path!!, versionDirectories[0]);
            }
            return session.defaultSession.loadExtension(extensionPath, {
              allowFileAccess: true,
            });
          })
          .filter(
            async (ext: Promise<Extension | undefined>) =>
              typeof (await ext) !== "undefined"
          )
      );
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
