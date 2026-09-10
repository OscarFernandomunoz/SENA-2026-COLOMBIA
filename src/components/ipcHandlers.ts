import { app, BrowserWindow, ipcMain } from 'electron';
import { openSofiaPlus, type SofiaCredentials } from './sofiaPlus/index.js';

export function registerIpcHandlers(): void {
  ipcMain.handle('app:get-version', (): string => app.getVersion());
  ipcMain.handle('sofia:open-and-fill', async (_event, credentials: SofiaCredentials): Promise<void> => {
    await openSofiaPlus(credentials);
  });
  ipcMain.on('app:set-theme', (_event, theme: 'light' | 'dark') => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.setTitleBarOverlay(theme === 'dark'
      ? { color: '#11161c', symbolColor: '#eef2f5', height: 32 }
      : { color: '#f4f6f8', symbolColor: '#17212b', height: 32 });
  });
}
