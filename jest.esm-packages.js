/**
 * Packages published as ESM-only, which Jest (running CommonJS) must transform.
 *
 * Jest does not merge `transformIgnorePatterns` from a preset with a project's
 * own, so every project that overrides the pattern builds it from this list.
 */
const ESM_PACKAGES = ['react-router', 'cookie-es'];

/**
 * @param {string[]} [extraPackages] project-specific packages to transform too
 * @returns {string} a `transformIgnorePatterns` entry
 */
const esmTransformIgnorePattern = (extraPackages = []) =>
  `node_modules/(?!(${[...extraPackages, ...ESM_PACKAGES].join('|')})/)`;

module.exports = { ESM_PACKAGES, esmTransformIgnorePattern };
