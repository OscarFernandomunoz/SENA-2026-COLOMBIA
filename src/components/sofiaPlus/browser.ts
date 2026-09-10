import { BrowserWindow } from 'electron';
import type { ClickPoint } from './types.js';

export const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

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

export function clickAtPoint(window: BrowserWindow, point: ClickPoint): void {
  window.webContents.sendInputEvent({ type: 'mouseMove', x: point.x, y: point.y });
  window.webContents.sendInputEvent({ type: 'mouseDown', x: point.x, y: point.y, button: 'left' });
  window.webContents.sendInputEvent({ type: 'mouseUp', x: point.x, y: point.y, button: 'left' });
}

export async function clickScript(
  window: BrowserWindow,
  script: string,
  errorMessage: string,
): Promise<void> {
  const point = await executeInFrames<ClickPoint | null>(window, script, Boolean);
  if (!point) throw new Error(errorMessage);
  clickAtPoint(window, point);
}

export async function booleanScript(
  window: BrowserWindow,
  script: string,
  errorMessage: string,
): Promise<void> {
  const result = await executeInFrames<boolean>(window, script, Boolean);
  if (!result) throw new Error(errorMessage);
}
