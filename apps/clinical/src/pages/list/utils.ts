import { type Extension } from '../../extensions';

export const groupExtensionsByPoint = (
  extensions: Extension[],
): Map<string, Extension[]> => {
  const map = new Map<string, Extension[]>();
  for (const ext of extensions) {
    const group = map.get(ext.extensionPointId) ?? [];
    group.push(ext);
    map.set(ext.extensionPointId, group);
  }
  return map;
};
