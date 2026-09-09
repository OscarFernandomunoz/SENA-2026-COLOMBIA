import * as XLSX from 'xlsx';

// Interfaces
interface FileUploadState {
  file: File | null;
  isUploading: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
}

class AppUI {
  private state: FileUploadState = {
    file: null,
    isUploading: false
  };
  private clockElem = document.getElementById('clock') as HTMLElement;
  private dateElem = document.getElementById('currentDate') as HTMLElement;
  private cityElem = document.getElementById('currentCity') as HTMLElement;
  private weatherElem = document.getElementById('weather') as HTMLElement;
  private weatherIcon = document.getElementById('weatherIcon') as HTMLElement;
  private dropzone = document.getElementById('dropzone') as HTMLElement;
  private fileInput = document.getElementById('fileInput') as HTMLInputElement;
  private dropzoneText = document.getElementById('dropzoneText') as HTMLElement;
  private excelPreview = document.getElementById('excelPreview') as HTMLElement;
  private btnUpload = document.getElementById('btnUpload') as HTMLButtonElement;
  private statusMessage = document.getElementById('statusMessage') as HTMLElement;
  private inputUser = document.getElementById('usuario') as HTMLInputElement;
  private inputPass = document.getElementById('password') as HTMLInputElement;
  private inputStartDate = document.getElementById('fechaInicio') as HTMLInputElement;
  private inputEndDate = document.getElementById('fechaFin') as HTMLInputElement;
  private themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;

  constructor() {
    this.initClock();
    void this.initLiveContext();
    this.initTheme();
    this.initFileHandling();
    this.initSubmit();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem('aia-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light');

    this.themeToggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      this.setTheme(nextTheme);
      localStorage.setItem('aia-theme', nextTheme);
    });
  }

  private setTheme(theme: 'light' | 'dark'): void {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = theme;
    window.electronAPI.setTheme(theme);
    this.themeToggle.setAttribute('aria-pressed', String(isDark));
    this.themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    this.themeToggle.innerHTML = `<i class="fa-solid fa-${isDark ? 'sun' : 'moon'}" aria-hidden="true"></i><span>Tema ${isDark ? 'claro' : 'oscuro'}</span>`;
  }

  private initClock(): void {
    const updateTime = (): void => {
      const now = new Date();
      this.clockElem.textContent = now.toLocaleTimeString('es-CO', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      this.dateElem.textContent = now.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };
    setInterval(updateTime, 1000);
    updateTime();
  }

  private async initLiveContext(): Promise<void> {
    const location = await this.getLocation();
    this.cityElem.textContent = location.city;
    await this.updateWeather(location.latitude, location.longitude);
  }

  private getLocation(): Promise<LocationData> {
    const fallback: LocationData = { latitude: 4.711, longitude: -74.0721, city: 'Bogotá' };

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`);
            const data = await response.json() as { address?: { city?: string; town?: string; village?: string } };
            const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? 'Ubicación actual';
            resolve({ latitude, longitude, city });
          } catch {
            resolve({ latitude, longitude, city: 'Ubicación actual' });
          }
        },
        () => resolve(fallback),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    });
  }

  private async updateWeather(latitude: number, longitude: number): Promise<void> {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`);
      if (!response.ok) throw new Error('Weather request failed');
      const data = await response.json() as { current?: { temperature_2m: number; weather_code: number } };
      const current = data.current;
      if (!current) throw new Error('Weather data unavailable');
      this.weatherElem.textContent = `${Math.round(current.temperature_2m)} °C · ${this.weatherDescription(current.weather_code)}`;
      this.weatherIcon.className = `fa-solid ${this.weatherIconClass(current.weather_code)}`;
    } catch {
      this.weatherElem.textContent = 'Clima no disponible';
      this.weatherIcon.className = 'fa-solid fa-cloud-exclamation';
    }
  }

  private weatherDescription(code: number): string {
    if (code === 0) return 'Despejado';
    if ([1, 2, 3].includes(code)) return 'Parcialmente nublado';
    if ([45, 48].includes(code)) return 'Niebla';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Llovizna';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Lluvia';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Nieve';
    if ([95, 96, 99].includes(code)) return 'Tormenta';
    return 'Variable';
  }

  private weatherIconClass(code: number): string {
    if (code === 0) return 'fa-sun';
    if ([1, 2, 3].includes(code)) return 'fa-cloud-sun';
    if ([45, 48].includes(code)) return 'fa-smog';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'fa-cloud-rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'fa-snowflake';
    return 'fa-cloud-bolt';
  }

  // Arrastrar y Soltar (Drag & Drop)
  private initFileHandling(): void {
    this.dropzone.addEventListener('click', () => this.fileInput.click());

    this.dropzone.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer?.files.length) {
        this.validateAndSetFile(e.dataTransfer.files[0]);
      }
    });

    this.fileInput.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.length) {
        this.validateAndSetFile(target.files[0]);
      }
    });
  }

  private validateAndSetFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xls' || ext === 'xlsx') {
      this.state.file = file;
      this.dropzoneText.innerHTML = `Archivo seleccionado: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
      this.statusMessage.textContent = `Archivo "${file.name}" cargado. Listo para procesar.`;
      void this.previewExcel(file);
    } else {
      alert('Solo se permiten archivos Excel en formato .xls o .xlsx');
    }
  }

  private async previewExcel(file: File): Promise<void> {
    this.excelPreview.replaceChildren();
    this.excelPreview.textContent = 'Leyendo información del Excel...';

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const previewFragment = document.createDocumentFragment();

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: ''
        });
        const sheetSection = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = sheetName;
        sheetSection.appendChild(heading);

        if (rows.length === 0) {
          const emptyMessage = document.createElement('p');
          emptyMessage.textContent = 'Esta hoja está vacía.';
          sheetSection.appendChild(emptyMessage);
        } else {
          const table = document.createElement('table');
          const tableHead = document.createElement('thead');
          const tableBody = document.createElement('tbody');
          rows.forEach((row, rowIndex) => {
            const tableRow = document.createElement('tr');
            row.forEach((cell, cellIndex) => {
              const tableCell = document.createElement(rowIndex === 0 ? 'th' : 'td');
              const cellText = String(cell ?? '');

              if (rowIndex === 0) {
                tableCell.textContent = cellText || `Columna ${cellIndex + 1}`;
              } else {
                tableCell.textContent = cellText;
              }
              tableRow.appendChild(tableCell);
            });
            (rowIndex === 0 ? tableHead : tableBody).appendChild(tableRow);
          });
          table.append(tableHead, tableBody);
          const filterBar = document.createElement('div');
          filterBar.className = 'excel-filter-bar';

          const filterLabel = document.createElement('label');
          filterLabel.className = 'excel-filter-label';
          filterLabel.textContent = 'Buscar en';

          const columnSelect = document.createElement('select');
          columnSelect.className = 'excel-column-select';
          columnSelect.setAttribute('aria-label', 'Seleccionar columna para buscar');
          const allColumnsOption = document.createElement('option');
          allColumnsOption.value = 'all';
          allColumnsOption.textContent = 'Todas las columnas';
          columnSelect.appendChild(allColumnsOption);

          const headerCells = tableHead.rows[0]?.cells ?? [];
          Array.from(headerCells).forEach((headerCell, cellIndex) => {
            const option = document.createElement('option');
            option.value = String(cellIndex);
            option.textContent = headerCell.textContent || `Columna ${cellIndex + 1}`;
            columnSelect.appendChild(option);
          });

          const filterInput = document.createElement('input');
          filterInput.className = 'excel-filter-input';
          filterInput.type = 'search';
          filterInput.placeholder = 'Escribe para buscar...';
          filterInput.setAttribute('aria-label', 'Texto de búsqueda');

          const applyFilter = (): void => {
            const filterValue = filterInput.value.trim().toLocaleLowerCase();
            const selectedColumn = columnSelect.value;
            Array.from(tableBody.rows).forEach((bodyRow) => {
              const cells = Array.from(bodyRow.cells);
              const values = selectedColumn === 'all'
                ? cells.map((cell) => cell.textContent?.trim().toLocaleLowerCase() ?? '')
                : [cells[Number(selectedColumn)]?.textContent?.trim().toLocaleLowerCase() ?? ''];
              bodyRow.hidden = Boolean(filterValue) && !values.some((value) => value.includes(filterValue));
            });
          };

          columnSelect.addEventListener('change', applyFilter);
          filterInput.addEventListener('input', applyFilter);
          filterLabel.htmlFor = filterInput.id = `excel-filter-${sheetName.replace(/\W+/g, '-').toLowerCase()}`;
          filterBar.append(filterLabel, columnSelect, filterInput);

          const tableWrapper = document.createElement('div');
          tableWrapper.className = 'excel-table-wrapper';
          tableWrapper.appendChild(table);
          sheetSection.appendChild(filterBar);
          sheetSection.appendChild(tableWrapper);

          if (headerCells.length > 2) {
            const selectedColumnSection = document.createElement('div');
            selectedColumnSection.className = 'excel-selected-column';
            const selectedColumnTitle = document.createElement('h4');
            selectedColumnTitle.textContent = `Vista de ${headerCells[2].textContent || 'Columna 3'}`;
            selectedColumnSection.appendChild(selectedColumnTitle);

            const selectedColumnWrapper = document.createElement('div');
            selectedColumnWrapper.className = 'excel-table-wrapper excel-selected-column-wrapper';
            const selectedColumnTable = document.createElement('table');
            const selectedColumnHead = document.createElement('thead');
            const selectedColumnBody = document.createElement('tbody');
            const selectedHeaderRow = document.createElement('tr');
            const selectedHeaderCell = document.createElement('th');
            selectedHeaderCell.textContent = headerCells[2].textContent || 'Columna 3';
            selectedHeaderRow.appendChild(selectedHeaderCell);
            selectedColumnHead.appendChild(selectedHeaderRow);

            Array.from(tableBody.rows).forEach((sourceRow) => {
              const selectedRow = document.createElement('tr');
              const selectedCell = document.createElement('td');
              selectedCell.textContent = sourceRow.cells[2]?.textContent ?? '';
              selectedRow.appendChild(selectedCell);
              selectedColumnBody.appendChild(selectedRow);
            });

            selectedColumnTable.append(selectedColumnHead, selectedColumnBody);
            selectedColumnWrapper.appendChild(selectedColumnTable);
            selectedColumnSection.appendChild(selectedColumnWrapper);
            sheetSection.appendChild(selectedColumnSection);

            const updateSelectedColumn = (): void => {
              Array.from(tableBody.rows).forEach((sourceRow, rowIndex) => {
                const selectedRow = selectedColumnBody.rows[rowIndex];
                if (selectedRow) selectedRow.hidden = sourceRow.hidden;
              });
            };

            columnSelect.addEventListener('change', updateSelectedColumn);
            filterInput.addEventListener('input', updateSelectedColumn);
          }
        }

        previewFragment.appendChild(sheetSection);
      });

      this.excelPreview.replaceChildren(previewFragment);
      this.statusMessage.textContent = `Información de ${file.name} lista para revisar.`;
    } catch {
      this.excelPreview.textContent = 'No se pudo leer este archivo Excel.';
      this.statusMessage.textContent = 'Error al leer el archivo Excel.';
    }
  }

  private initSubmit(): void {
    this.btnUpload.addEventListener('click', async () => {
      if (!this.inputUser.value || !this.inputPass.value) {
        alert('Ingrese las credenciales de acceso.');
        return;
      }

      this.state.isUploading = true;
      this.btnUpload.disabled = true;
      this.btnUpload.textContent = 'Iniciando sesión...';
      this.statusMessage.textContent = 'Abriendo SofiaPlus, llenando los campos e iniciando sesión...';

      try {
        await window.electronAPI.openSofiaAndFill({
          username: this.inputUser.value,
          password: this.inputPass.value,
          startDate: this.inputStartDate.value,
          endDate: this.inputEndDate.value,
        });
        this.statusMessage.textContent = 'Sesión iniciada en SofiaPlus.';
      } catch {
        this.statusMessage.textContent = 'No se pudo abrir SofiaPlus.';
        alert('No se pudo abrir SofiaPlus. Revisa tu conexión e inténtalo nuevamente.');
      } finally {
        this.state.isUploading = false;
        this.btnUpload.disabled = false;
        this.btnUpload.textContent = 'Iniciar sesión en SofiaPlus';
      }
    });
  }
}

// Inicializar Aplicación
document.addEventListener('DOMContentLoaded', () => {
  new AppUI();
});