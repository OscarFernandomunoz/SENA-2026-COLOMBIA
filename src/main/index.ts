import { app, ipcMain, BrowserWindow } from 'electron';
import { createMainWindow } from './services/windowManager.js';

const SOFIA_URL = 'http://senasofiaplus.edu.co/sofia-public/';
let sofiaWindow: BrowserWindow | null = null;

interface SofiaCredentials {
  username: string;
  password: string;
  startDate: string;
  endDate: string;
}

async function openSofiaPlus(credentials: SofiaCredentials): Promise<void> {
  if (sofiaWindow && !sofiaWindow.isDestroyed()) {
    sofiaWindow.focus();
  } else {
    sofiaWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    sofiaWindow.on('closed', () => {
      sofiaWindow = null;
    });
    await sofiaWindow.loadURL(SOFIA_URL);
  }

  const script = `(${fillSofiaInputs.toString()})(${JSON.stringify(credentials)})`;
  let filled = false;
  for (let attempt = 0; attempt < 20 && !filled; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        filled = await frame.executeJavaScript(script);
      } catch {
        // El frame puede cambiar mientras SofiaPlus termina su redirección.
      }
      if (filled) break;
    }

    if (!filled) await new Promise((resolve) => setTimeout(resolve, 300));
  }
  if (!filled) {
    throw new Error('No se encontraron los campos de acceso de SofiaPlus.');
  }
}

async function fillSofiaInputs(credentials: SofiaCredentials): Promise<boolean> {
  const fields = Array.from(document.querySelectorAll<HTMLInputElement>('input'))
    .filter((field) => field.type !== 'hidden' && field.getClientRects().length > 0);
  const textOf = (field: HTMLInputElement): string => [
    field.type,
    field.name,
    field.id,
    field.placeholder,
    field.getAttribute('aria-label') ?? '',
  ].join(' ').toLowerCase();
  const findField = (patterns: string[], type?: string): HTMLInputElement | undefined => fields.find((field) => {
    const matchesType = !type || field.type === type;
    return matchesType && patterns.some((pattern) => textOf(field).includes(pattern));
  });
  const setValue = (field: HTMLInputElement | undefined, value: string): void => {
    if (!field || !value) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const username = findField(['número de documento', 'numero de documento'], 'text')
    ?? findField(['usuario', 'user', 'login', 'documento', 'identificacion'], 'text')
    ?? findField(['usuario', 'user', 'login', 'documento', 'identificacion'], 'email')
    ?? fields.find((field) => ['text', 'email', 'tel', 'number'].includes(field.type));
  const password = findField(['contraseña', 'contrasena', 'password', 'clave'], 'password')
    ?? fields.find((field) => field.type === 'password');
  const dates = fields.filter((field) => field.type === 'date');
  const startDate = findField(['inicio', 'desde', 'start']) ?? dates[0];
  const endDate = findField(['fin', 'hasta', 'end']) ?? dates[1];

  if (username && password) {
    setValue(username, credentials.username);
    setValue(password, credentials.password);
    setValue(startDate, credentials.startDate);
    setValue(endDate, credentials.endDate);
    username.focus();
    const loginControl = Array.from(document.querySelectorAll<HTMLElement>(
      'button, input[type="submit"], input[type="button"], a',
    )).find((control) => {
      const label = [
        control.textContent ?? '',
        control.getAttribute('value') ?? '',
        control.getAttribute('aria-label') ?? '',
        control.getAttribute('id') ?? '',
        control.getAttribute('name') ?? '',
      ].join(' ').toLowerCase();
      return /ingresar|iniciar|login|aceptar|entrar/.test(label);
    });

    if (loginControl) {
      loginControl.click();
    } else {
      password.form?.requestSubmit();
    }
    return true;
  }

  return false;
}

function init(): void {
  app.whenReady().then(() => {
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

    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

init();