import { app, BrowserWindow, ipcMain } from 'electron';
import { openSofiaPlus, type SofiaCredentials } from './sofiaPlus/index.js';

// Registra los canales IPC que usa la app para comunicarse entre el renderer y el proceso principal.
export function registerIpcHandlers(): void {
  // Entrega la versión actual de la aplicación al renderer.
  ipcMain.handle('app:get-version', (): string => app.getVersion());

  // Ejecuta el flujo completo de login y manejo de SofiaPlus con las credenciales recibidas.
  ipcMain.handle('sofia:open-and-fill', async (_event, credentials: SofiaCredentials): Promise<void> => {
    await openSofiaPlus(credentials);
  });

  // Cambia el color del overlay de la barra de título para que coincida con el tema visual actual.
  ipcMain.on('app:set-theme', (_event, theme: 'light' | 'dark') => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.setTitleBarOverlay(theme === 'dark'
      ? { color: '#11161c', symbolColor: '#eef2f5', height: 32 }
      : { color: '#f4f6f8', symbolColor: '#17212b', height: 32 });
  });
}
