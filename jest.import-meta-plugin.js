/**
 * Babel plugin used by Jest only.
 *
 * react-router v8 ships ESM-only code that references `import.meta.hot`.
 * Jest runs the code as CommonJS, where `import.meta` is a syntax error, so
 * it is replaced with an empty object (equivalent to `import.meta.hot`
 * being undefined, i.e. a non-Vite environment).
 *
 * Only files inside the ESM-only packages from `jest.esm-packages.js` are
 * rewritten, so `import.meta` in app code is left for Babel to report.
 */
const { ESM_PACKAGES } = require('./jest.esm-packages');

const ESM_PACKAGE_PATH = new RegExp(
  `[\\\\/]node_modules[\\\\/](${ESM_PACKAGES.join('|')})[\\\\/]`,
);

module.exports = function replaceImportMeta() {
  return {
    name: 'replace-import-meta',
    visitor: {
      MetaProperty(path, state) {
        if (!ESM_PACKAGE_PATH.test(state.filename ?? '')) return;
        const { meta, property } = path.node;
        if (meta.name === 'import' && property.name === 'meta') {
          path.replaceWithSourceString('({})');
        }
      },
    },
  };
};
