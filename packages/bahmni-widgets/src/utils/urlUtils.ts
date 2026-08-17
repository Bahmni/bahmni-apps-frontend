import jsonata from 'jsonata';

export const resolveNavigationURL = async (
  template: string,
  evaluationData: unknown,
): Promise<string | null> => {
  try {
    const placeholders = [...template.matchAll(/\{([^}]+)\}/g)];
    let resolved = template;

    for (const [fullMatch, expression] of placeholders) {
      const compiled = jsonata(expression);
      const value = await compiled.evaluate(evaluationData as Record<string, unknown>);
      if (value == null) return null;
      resolved = resolved.replace(fullMatch, encodeURIComponent(String(value)));
    }

    return resolved;
  } catch {
    return null;
  }
};
