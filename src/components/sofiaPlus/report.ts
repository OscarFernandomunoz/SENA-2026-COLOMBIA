import type { ClickPoint } from './types.js';

export async function fillReportDates(dates: { startDate: string; endDate: string }): Promise<boolean> {
  const fields = Array.from(document.querySelectorAll<HTMLInputElement>('input'))
    .filter((field) => field.type !== 'hidden' && field.getClientRects().length > 0);
  const fieldText = (field: HTMLInputElement): string => [
    field.type, field.name, field.id, field.placeholder, field.getAttribute('aria-label') ?? '',
    field.parentElement?.textContent ?? '',
  ].join(' ').toLocaleLowerCase();
  const findField = (patterns: string[]): HTMLInputElement | undefined => fields.find((field) => {
    const text = fieldText(field);
    return patterns.some((pattern) => text.includes(pattern));
  });
  const setValue = (field: HTMLInputElement | undefined, value: string): void => {
    if (!field) return;
    const [year, month, day] = value.split('-');
    const nextValue = field.type === 'date' || !year || !month || !day ? value : `${day}/${month}/${year}`;
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

export async function findInstructorPicker(): Promise<ClickPoint | null> {
  const pointFor = (element: HTMLElement): ClickPoint => {
    const rect = element.getBoundingClientRect();
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
  };
  const picker = document.getElementById('formConsultarRegistroTiempo:instructorOLK');
  if (!(picker instanceof HTMLElement) || picker.getClientRects().length === 0) return null;
  const eventOptions = { bubbles: true, cancelable: true, view: window, button: 0, detail: 1 };
  picker.dispatchEvent(new MouseEvent('mousedown', eventOptions));
  picker.dispatchEvent(new MouseEvent('mouseup', eventOptions));
  picker.dispatchEvent(new MouseEvent('click', eventOptions));
  picker.click();
  return pointFor(picker);
}

export async function selectCitizenshipId(): Promise<boolean> {
  const normalize = (text: string): string => text.trim().toLocaleLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const target = 'cedula de ciudadania';
  const select = Array.from(document.querySelectorAll<HTMLSelectElement>('select')).find((field) => (
    field.getClientRects().length > 0 && Array.from(field.options).some((option) => normalize(option.textContent ?? '') === target)
  ));
  if (!select) return false;
  const option = Array.from(select.options).find((item) => normalize(item.textContent ?? '') === target);
  if (!option) return false;
  select.focus();
  select.click();
  select.selectedIndex = option.index;
  option.selected = true;
  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  select.dispatchEvent(changeEvent);
  (select.onchange as ((event: Event) => void) | null)?.call(select, changeEvent);
  return select.selectedIndex === option.index && normalize(select.options[select.selectedIndex]?.textContent ?? '') === target;
}
