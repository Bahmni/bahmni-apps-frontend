/**
 * Babel plugin used by Jest only.
 *
 * react-router v8 ships ESM-only code that references `import.meta.hot`.
 * Jest runs the code as CommonJS, where `import.meta` is a syntax error, so
 * it is replaced with an empty object (equivalent to `import.meta.hot`
 * being undefined, i.e. a non-Vite environment).
 */
module.exports = function replaceImportMeta() {
  return {
    name: 'replace-import-meta',
    visitor: {
      MetaProperty(path) {
        const { meta, property } = path.node;
        if (meta.name === 'import' && property.name === 'meta') {
          path.replaceWithSourceString('({})');
        }
      },
    },
  };
};
