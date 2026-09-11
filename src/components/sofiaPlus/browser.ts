import { BrowserWindow } from 'electron';
import type { ClickPoint } from './types.js';

// Este módulo encapsula la ejecución de scripts dentro de la ventana de SofiaPlus.
// Permite detectar elementos, esperar a que carguen y simular clics reales en la interfaz.
const ACTION_DELAY_MS = 5_000;

// Espera una cantidad fija de milisegundos antes de continuar con la siguiente acción.
export const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

// Ejecuta un fragmento de JavaScript en todos los frames activos de la ventana hasta que la condición sea verdadera.
export async function executeInFrames<T>(
  window: BrowserWindow,
  script: string,
  predicate: (value: T) => boolean,
  attempts = 30,
): Promise<T | undefined> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const frames = [window.webContents.mainFrame, ...window.webContents.mainFrame.frames];
    for (const frame of frames) {
      try {
        const result = await frame.executeJavaScript(script) as T;
        if (predicate(result)) return result;
      } catch {
        // El frame puede cambiar durante una redirección o una carga parcial.
      }
    }
    await wait(300);
  }
  return undefined;
}

// Simula un movimiento y clic del mouse en la posición detectada en la pantalla del navegador.
export function clickAtPoint(window: BrowserWindow, point: ClickPoint): void {
  window.webContents.sendInputEvent({ type: 'mouseMove', x: point.x, y: point.y });
  window.webContents.sendInputEvent({ type: 'mouseDown', x: point.x, y: point.y, button: 'left' });
  window.webContents.sendInputEvent({ type: 'mouseUp', x: point.x, y: point.y, button: 'left' });
}

// Ejecuta una acción basada en un script que debe devolver una posición y luego hace clic en esa coordenada.
export async function clickScript(
  window: BrowserWindow,
  script: string,
  errorMessage: string,
): Promise<void> {
  await wait(ACTION_DELAY_MS);
  const point = await executeInFrames<ClickPoint | null>(window, script, Boolean);
  if (!point) throw new Error(errorMessage);
  clickAtPoint(window, point);
}

// Ejecuta un script que debe devolver un valor booleano para confirmar que una acción o elemento existe.
export async function booleanScript(
  window: BrowserWindow,
  script: string,
  errorMessage: string,
): Promise<void> {
  await wait(ACTION_DELAY_MS);
  const result = await executeInFrames<boolean>(window, script, Boolean);
  if (!result) throw new Error(errorMessage);
}
