import type { InputControl } from './models';

const inputControlRegistry: InputControl[] = [];

export function registerInputControl(entry: InputControl): void {
  inputControlRegistry.push(entry);
}

export function getRegisteredInputControls(): InputControl[] {
  return inputControlRegistry;
}

export function clearRegistry(): void {
  inputControlRegistry.length = 0;
}
