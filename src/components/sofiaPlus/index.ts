import { BrowserWindow } from 'electron';
import { booleanScript, clickScript, wait } from './browser.js';
import { fillSofiaInputs } from './login.js';
import {
  findConsolidatedTimeOption,
  findInstructorTimeOption,
  findTimeManagementOption,
  openAspiranteOptions,
  selectCurriculumOption,
} from './navigation.js';
import { fillReportDates, findInstructorPicker, selectCitizenshipId } from './report.js';
import type { SofiaCredentials } from './types.js';

const SOFIA_URL = 'http://senasofiaplus.edu.co/sofia-public/';
let sofiaWindow: BrowserWindow | null = null;

export type { SofiaCredentials } from './types.js';

async function loadWindow(): Promise<BrowserWindow> {
  if (sofiaWindow && !sofiaWindow.isDestroyed()) {
    sofiaWindow.focus();
    return sofiaWindow;
  }
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  sofiaWindow = window;
  window.on('closed', () => { sofiaWindow = null; });
  let lastLoadError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await window.loadURL(SOFIA_URL);
      return window;
    } catch (error) {
      lastLoadError = error instanceof Error ? error : new Error(String(error));
      await wait(500 * (attempt + 1));
    }
  }
  window.close();
  throw new Error(`No se pudo cargar SofiaPlus: ${lastLoadError?.message ?? 'error desconocido'}`);
}

export async function openSofiaPlus(credentials: SofiaCredentials): Promise<void> {
  const window = await loadWindow();
  await booleanScript(window, `(${fillSofiaInputs.toString()})(${JSON.stringify(credentials)})`, 'No se encontraron los campos de acceso de SofiaPlus.');
  await clickScript(window, `(${openAspiranteOptions.toString()})()`, 'No se encontró el selector Aspirante después del login.');
  await booleanScript(window, `(${selectCurriculumOption.toString()})()`, 'No cuenta con el rol necesario para acceder a Gestión Desarrollo Curricular.');
  await clickScript(window, `(${findTimeManagementOption.toString()})()`, 'No se encontró la opción Gestión de Tiempos.');
  await clickScript(window, `(${findConsolidatedTimeOption.toString()})()`, 'No se encontró la opción Consultar Consolidado de Tiempos.');
  await clickScript(window, `(${findInstructorTimeOption.toString()})()`, 'No se encontró la opción Consultar Registro de Tiempo de Instructores.');
  await booleanScript(window, `(${fillReportDates.toString()})(${JSON.stringify({ startDate: credentials.startDate, endDate: credentials.endDate })})`, 'No se encontraron los campos de fechas del informe.');
  await clickScript(window, `(${findInstructorPicker.toString()})()`, 'No se encontró el botón para seleccionar el instructor.');
  await booleanScript(window, `(${selectCitizenshipId.toString()})()`, 'No se encontró el campo Tipo de Identificación.');
}
