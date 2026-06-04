export const DEFAULT_DOUBLE_INTERVAL = 350;

function parseKeys(keys: string): {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = keys.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  return {
    key,
    meta: mods.has('meta') || mods.has('cmd'),
    ctrl: mods.has('ctrl'),
    shift: mods.has('shift'),
    alt: mods.has('alt'),
  };
}

export function matchesKeys(e: KeyboardEvent, keys: string): boolean {
  const p = parseKeys(keys);
  return (
    e.key.toLowerCase() === p.key &&
    e.metaKey === p.meta &&
    e.ctrlKey === p.ctrl &&
    e.shiftKey === p.shift &&
    e.altKey === p.alt
  );
}
