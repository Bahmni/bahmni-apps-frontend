export default {
  displayName: '@bahmni/widgets',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['./setupTests.ts'],
  // react-markdown/remark-gfm and the whole unified/remark/rehype/mdast/hast
  // ecosystem underneath them ship ESM-only, so they need transforming too.
  transformIgnorePatterns: [
    'node_modules/(?!(@bahmni|uuid|react-markdown|remark-.*|rehype-.*|mdast-.*|hast-.*|hastscript|unist-.*|micromark.*|vfile.*|estree-.*|unified|bail|is-plain-obj|trough|devlop|decode-named-character-reference|character-entities.*|character-reference-invalid|parse-entities|property-information|space-separated-tokens|comma-separated-tokens|web-namespaces|zwitch|html-void-elements|html-url-attributes|trim-lines|ccount|escape-string-regexp|longest-streak|markdown-table|stringify-entities)/)',
  ],
};
