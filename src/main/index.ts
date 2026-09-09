import { app, ipcMain, BrowserWindow } from 'electron';
import { createMainWindow } from './services/windowManager.js';

const SOFIA_URL = 'http://senasofiaplus.edu.co/sofia-public/';
let sofiaWindow: BrowserWindow | null = null;

const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

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

    let lastLoadError: Error | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await sofiaWindow.loadURL(SOFIA_URL);
        lastLoadError = undefined;
        break;
      } catch (error) {
        lastLoadError = error instanceof Error ? error : new Error(String(error));
        await wait(500 * (attempt + 1));
      }
    }

    if (lastLoadError) {
      sofiaWindow.close();
      throw new Error(`No se pudo cargar SofiaPlus: ${lastLoadError.message}`);
    }
  }

  const script = `(${fillSofiaInputs.toString()})(${JSON.stringify(credentials)})`;
  let filled = false;
  for (let attempt = 0; attempt < 20 && !filled; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        filled = Boolean(await frame.executeJavaScript(script));
      } catch {
        // El frame puede cambiar mientras SofiaPlus termina su redirección.
      }
      if (filled) break;
    }

    if (!filled) await wait(300);
  }
  if (!filled) {
    throw new Error('No se encontraron los campos de acceso de SofiaPlus.');
  }

  const openAspiranteScript = `(${openAspiranteOptions.toString()})()`;
  let optionsOpened = false;
  for (let attempt = 0; attempt < 30 && !optionsOpened; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        const clickPoint = await frame.executeJavaScript(openAspiranteScript) as ClickPoint | null;
        if (clickPoint) {
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseMove', x: clickPoint.x, y: clickPoint.y });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseDown', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseUp', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          optionsOpened = true;
        }
      } catch {
        // El frame puede cambiar durante la redirección posterior al login.
      }
      if (optionsOpened) break;
    }

    if (!optionsOpened) await wait(300);
  }

  if (!optionsOpened) {
    throw new Error('No se encontró el selector Aspirante después del login.');
  }

  await wait(300);
  const curriculumScript = `(${selectCurriculumOption.toString()})()`;
  let curriculumSelected = false;
  for (let attempt = 0; attempt < 30 && !curriculumSelected; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        curriculumSelected = Boolean(await frame.executeJavaScript(curriculumScript));
      } catch {
        // El frame puede cambiar después de abrir el menú de Aspirante.
      }
      if (curriculumSelected) break;
    }

    if (!curriculumSelected) await wait(300);
  }

  if (!curriculumSelected) {
    throw new Error('No cuenta con el rol necesario para acceder a Gestión Desarrollo Curricular.');
  }

  await wait(300);
  const timeManagementScript = `(${findTimeManagementOption.toString()})()`;
  let timeManagementOpened = false;
  for (let attempt = 0; attempt < 30 && !timeManagementOpened; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        const clickPoint = await frame.executeJavaScript(timeManagementScript) as ClickPoint | null;
        if (clickPoint) {
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseMove', x: clickPoint.x, y: clickPoint.y });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseDown', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseUp', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          timeManagementOpened = true;
        }
      } catch {
        // El frame puede cambiar mientras carga el módulo curricular.
      }
      if (timeManagementOpened) break;
    }

    if (!timeManagementOpened) await wait(300);
  }

  if (!timeManagementOpened) {
    throw new Error('No se encontró la opción Gestión de Tiempos.');
  }

  await wait(300);
  const consolidatedScript = `(${findConsolidatedTimeOption.toString()})()`;
  let consolidatedSelected = false;
  for (let attempt = 0; attempt < 30 && !consolidatedSelected; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        const clickPoint = await frame.executeJavaScript(consolidatedScript) as ClickPoint | null;
        if (clickPoint) {
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseMove', x: clickPoint.x, y: clickPoint.y });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseDown', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseUp', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          consolidatedSelected = true;
        }
      } catch {
        // El frame puede cambiar al cargar la opción de tiempos.
      }
      if (consolidatedSelected) break;
    }

    if (!consolidatedSelected) await wait(300);
  }

  if (!consolidatedSelected) {
    throw new Error('No se encontró la opción Consultar Consolidado de Tiempos.');
  }

  await wait(300);
  const instructorTimeScript = `(${findInstructorTimeOption.toString()})()`;
  let instructorTimeSelected = false;
  for (let attempt = 0; attempt < 30 && !instructorTimeSelected; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        const clickPoint = await frame.executeJavaScript(instructorTimeScript) as ClickPoint | null;
        if (clickPoint) {
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseMove', x: clickPoint.x, y: clickPoint.y });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseDown', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseUp', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          instructorTimeSelected = true;
        }
      } catch {
        // El frame puede cambiar al cargar las opciones del consolidado.
      }
      if (instructorTimeSelected) break;
    }

    if (!instructorTimeSelected) await wait(300);
  }

  if (!instructorTimeSelected) {
    throw new Error('No se encontró la opción Consultar Registro de Tiempo de Instructores.');
  }

  await wait(300);
  const datesScript = `(${fillReportDates.toString()})(${JSON.stringify({
    startDate: credentials.startDate,
    endDate: credentials.endDate,
  })})`;
  let datesFilled = false;
  for (let attempt = 0; attempt < 30 && !datesFilled; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        datesFilled = Boolean(await frame.executeJavaScript(datesScript));
      } catch {
        // El frame puede cambiar mientras carga el formulario de horas.
      }
      if (datesFilled) break;
    }

    if (!datesFilled) await wait(300);
  }

  if (!datesFilled) {
    throw new Error('No se encontraron los campos de fechas del informe.');
  }

  await wait(300);
  const instructorPickerScript = `(${findInstructorPicker.toString()})()`;
  let instructorPickerOpened = false;
  for (let attempt = 0; attempt < 30 && !instructorPickerOpened; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        const clickPoint = await frame.executeJavaScript(instructorPickerScript) as ClickPoint | null;
        if (clickPoint) {
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseMove', x: clickPoint.x, y: clickPoint.y });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseDown', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          sofiaWindow.webContents.sendInputEvent({ type: 'mouseUp', x: clickPoint.x, y: clickPoint.y, button: 'left' });
          instructorPickerOpened = true;
        }
      } catch {
        // El frame puede cambiar al abrir la ventana de instructores.
      }
      if (instructorPickerOpened) break;
    }

    if (!instructorPickerOpened) await wait(300);
  }

  if (!instructorPickerOpened) {
    throw new Error('No se encontró el botón para seleccionar el instructor.');
  }

  await wait(300);
  const identificationScript = `(${selectCitizenshipId.toString()})()`;
  let identificationSelected = false;
  for (let attempt = 0; attempt < 30 && !identificationSelected; attempt += 1) {
    const frames = [sofiaWindow.webContents.mainFrame, ...sofiaWindow.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        identificationSelected = Boolean(await frame.executeJavaScript(identificationScript));
      } catch {
        // El frame puede cambiar mientras carga la ventana de selección.
      }
      if (identificationSelected) break;
    }

    if (!identificationSelected) await wait(300);
  }

  if (!identificationSelected) {
    throw new Error('No se encontró el campo Tipo de Identificación.');
  }
}

interface ClickPoint {
  x: number;
  y: number;
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

async function openAspiranteOptions(): Promise<ClickPoint | null> {
  const visible = (element: HTMLElement): boolean => element.getClientRects().length > 0;
  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
    .filter(visible);
  const aspiranteSelect = selects.find((select) => Array.from(select.options).some((option) => (
    option.textContent?.trim().toLowerCase() === 'aspirante'
  )));

  if (aspiranteSelect) {
    const rect = aspiranteSelect.getBoundingClientRect();
    let x = rect.left + (rect.width / 2);
    let y = rect.top + (rect.height / 2);
    let currentWindow: Window = window;
    while (currentWindow.frameElement) {
      const frameRect = currentWindow.frameElement.getBoundingClientRect();
      x += frameRect.left;
      y += frameRect.top;
      currentWindow = currentWindow.parent;
    }
    return { x, y };
  }

  const aspiranteControl = Array.from(document.querySelectorAll<HTMLElement>(
    'button, [role="button"], [role="combobox"]',
  )).find((control) => control.textContent?.trim().toLowerCase() === 'aspirante' && visible(control));

  if (aspiranteControl) {
    const rect = aspiranteControl.getBoundingClientRect();
    return { x: rect.left + (rect.width / 2), y: rect.top + (rect.height / 2) };
  }

  return null;
}

async function selectCurriculumOption(): Promise<boolean> {
  const target = 'gestión desarrollo curricular';
  const normalize = (text: string): string => text.trim().toLocaleLowerCase();
  const visible = (element: HTMLElement): boolean => element.getClientRects().length > 0;

  for (const select of Array.from(document.querySelectorAll<HTMLSelectElement>('select'))) {
    const option = Array.from(select.options).find((item) => normalize(item.textContent ?? '') === target);
    if (option && visible(select)) {
      select.value = option.value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }

  const control = Array.from(document.querySelectorAll<HTMLElement>(
    'a, button, [role="menuitem"], [role="option"], li',
  )).find((element) => normalize(element.textContent ?? '') === target && visible(element));

  if (control) {
    control.click();
    return true;
  }

  return false;
}

async function findTimeManagementOption(): Promise<ClickPoint | null> {
  const target = 'gestión de tiempos';
  const normalize = (text: string): string => text.trim().toLocaleLowerCase();
  const visible = (element: HTMLElement): boolean => element.getClientRects().length > 0;
  const control = Array.from(document.querySelectorAll<HTMLElement>(
    'a[href], a[onclick], button, [role="menuitem"], [role="option"], li',
  )).find((element) => normalize(element.textContent ?? '') === target && visible(element));

  if (!control) return null;

  const clickable = control.matches('a, button')
    ? control
    : control.querySelector<HTMLElement>('a[href], a[onclick], button') ?? control;
  const eventOptions = { bubbles: true, cancelable: true, view: window, button: 0, detail: 1 };
  clickable.dispatchEvent(new MouseEvent('mousedown', eventOptions));
  clickable.dispatchEvent(new MouseEvent('mouseup', eventOptions));
  clickable.dispatchEvent(new MouseEvent('click', eventOptions));
  clickable.click();

  const rect = clickable.getBoundingClientRect();
  let x = rect.left + (rect.width / 2);
  let y = rect.top + (rect.height / 2);
  let currentWindow: Window = window;
  while (currentWindow.frameElement) {
    const frameRect = currentWindow.frameElement.getBoundingClientRect();
    x += frameRect.left;
    y += frameRect.top;
    currentWindow = currentWindow.parent;
  }
  return { x, y };
}

async function findConsolidatedTimeOption(): Promise<ClickPoint | null> {
  const target = 'consultar consolidado de tiempos';
  const normalize = (text: string): string => text.trim().toLocaleLowerCase();
  const visible = (element: HTMLElement): boolean => element.getClientRects().length > 0;
  const control = Array.from(document.querySelectorAll<HTMLElement>(
    'a[href], a[onclick], button, [role="menuitem"], [role="option"], li',
  )).find((element) => normalize(element.textContent ?? '') === target && visible(element));

  if (!control) return null;

  const clickable = control.matches('a, button')
    ? control
    : control.querySelector<HTMLElement>('a[href], a[onclick], button') ?? control;
  clickable.click();

  const rect = clickable.getBoundingClientRect();
  let x = rect.left + (rect.width / 2);
  let y = rect.top + (rect.height / 2);
  let currentWindow: Window = window;
  while (currentWindow.frameElement) {
    const frameRect = currentWindow.frameElement.getBoundingClientRect();
    x += frameRect.left;
    y += frameRect.top;
    currentWindow = currentWindow.parent;
  }
  return { x, y };
}

async function findInstructorTimeOption(): Promise<ClickPoint | null> {
  const target = 'consultar registro de tiempo de instructores';
  const normalize = (text: string): string => text.trim().toLocaleLowerCase();
  const visible = (element: HTMLElement): boolean => element.getClientRects().length > 0;
  const control = Array.from(document.querySelectorAll<HTMLElement>(
    'a[href], a[onclick], button, [role="menuitem"], [role="option"], li',
  )).find((element) => normalize(element.textContent ?? '') === target && visible(element));

  if (!control) return null;

  const clickable = control.matches('a, button')
    ? control
    : control.querySelector<HTMLElement>('a[href], a[onclick], button') ?? control;
  clickable.click();

  const rect = clickable.getBoundingClientRect();
  let x = rect.left + (rect.width / 2);
  let y = rect.top + (rect.height / 2);
  let currentWindow: Window = window;
  while (currentWindow.frameElement) {
    const frameRect = currentWindow.frameElement.getBoundingClientRect();
    x += frameRect.left;
    y += frameRect.top;
    currentWindow = currentWindow.parent;
  }
  return { x, y };
}

async function fillReportDates(dates: { startDate: string; endDate: string }): Promise<boolean> {
  const visible = (element: HTMLInputElement): boolean => element.getClientRects().length > 0;
  const fields = Array.from(document.querySelectorAll<HTMLInputElement>('input'))
    .filter((field) => field.type !== 'hidden' && visible(field));
  const fieldText = (field: HTMLInputElement): string => [
    field.type,
    field.name,
    field.id,
    field.placeholder,
    field.getAttribute('aria-label') ?? '',
    field.parentElement?.textContent ?? '',
  ].join(' ').toLocaleLowerCase();
  const findField = (patterns: string[]): HTMLInputElement | undefined => fields.find((field) => {
    const text = fieldText(field);
    return patterns.some((pattern) => text.includes(pattern));
  });
  const toDisplayDate = (value: string): string => {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  };
  const setValue = (field: HTMLInputElement | undefined, value: string): void => {
    if (!field) return;
    const nextValue = field.type === 'date' ? value : toDisplayDate(value);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(field, nextValue);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.blur();
  };

  const startDate = findField(['fecha inicio', 'fecha de inicio', 'inicio', 'desde']);
  const endDate = findField(['fecha fin', 'fecha de fin', 'fin', 'hasta']);
  if (!startDate || !endDate) return false;

  setValue(startDate, dates.startDate);
  setValue(endDate, dates.endDate);
  return true;
}

async function findInstructorPicker(): Promise<ClickPoint | null> {
  const visible = (element: HTMLElement): boolean => element.getClientRects().length > 0;
  const picker = document.getElementById('formConsultarRegistroTiempo:instructorOLK');

  if (!picker || !visible(picker)) return null;

  const eventOptions = { bubbles: true, cancelable: true, view: window, button: 0, detail: 1 };
  picker.dispatchEvent(new MouseEvent('mousedown', eventOptions));
  picker.dispatchEvent(new MouseEvent('mouseup', eventOptions));
  picker.dispatchEvent(new MouseEvent('click', eventOptions));
  picker.click();

  const rect = picker.getBoundingClientRect();
  let x = rect.left + (rect.width / 2);
  let y = rect.top + (rect.height / 2);
  let currentWindow: Window = window;
  while (currentWindow.frameElement) {
    const frameRect = currentWindow.frameElement.getBoundingClientRect();
    x += frameRect.left;
    y += frameRect.top;
    currentWindow = currentWindow.parent;
  }
  return { x, y };
}

async function selectCitizenshipId(): Promise<boolean> {
  const normalize = (text: string): string => text.trim().toLocaleLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const visible = (element: HTMLSelectElement): boolean => element.getClientRects().length > 0;
  const target = 'cedula de ciudadania';
  const select = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
    .find((field) => visible(field) && Array.from(field.options).some((option) => (
      normalize(option.textContent ?? '') === target
    )));

  if (!select) return false;

  const option = Array.from(select.options).find((item) => normalize(item.textContent ?? '') === target);
  if (!option) return false;

  select.focus();
  select.click();
  select.selectedIndex = option.index;
  option.selected = true;
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  select.dispatchEvent(inputEvent);
  select.dispatchEvent(changeEvent);
  (select.onchange as ((event: Event) => void) | null)?.call(select, changeEvent);
  return select.selectedIndex === option.index && normalize(select.options[select.selectedIndex]?.textContent ?? '') === target;
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