import { BrowserWindow } from 'electron';
import { join } from 'node:path';

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    autoHideMenuBar: true,
    backgroundColor: '#f4f6f8',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f4f6f8',
      symbolColor: '#17212b',
      height: 32,
    },
    webPreferences: {
      preload: join(process.cwd(), 'dist/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(join(process.cwd(), 'dist/renderer/index.html'));
  return mainWindow;
}