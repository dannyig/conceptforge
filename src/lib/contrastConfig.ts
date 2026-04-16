export const HIGH_CONTRAST_KEY = 'conceptforge:high-contrast-nodes'

export function getHighContrast(): boolean {
  try {
    return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true'
  } catch {
    return false
  }
}

export function setHighContrast(value: boolean): void {
  try {
    localStorage.setItem(HIGH_CONTRAST_KEY, String(value))
  } catch {
    // ignore
  }
}
