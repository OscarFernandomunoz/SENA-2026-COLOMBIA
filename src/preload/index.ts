import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  openSofiaAndFill: (credentials: {
    username: string;
    password: string;
    startDate: string;
    endDate: string;
  }): Promise<void> => ipcRenderer.invoke('sofia:open-and-fill', credentials),
  setTheme: (theme: 'light' | 'dark'): void => {
    ipcRenderer.send('app:set-theme', theme);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);