export interface IElectronAPI {
  getVersion: () => Promise<string>;
  openSofiaAndFill: (credentials: {
    username: string;
    password: string;
    startDate: string;
    endDate: string;
  }) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}