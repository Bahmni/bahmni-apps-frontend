const config = {
  features: ['*.feature'],
  glue: ['src/__tests__/step_definitions/**/*.ts'],
  require: ['src/__tests__/step_definitions/**/*.ts'],
  format: [
    'progress-bar',
    'json:reports/cucumber_report.json',
    'html:reports/cucumber_report.html',
  ],
  parallel: 1,
  retry: 0,
  strict: true,
  dryRun: false,
  failFast: false,
  snippets: true,
  source: true,
  profile: false,
  backtrace: false,
  requireModule: ['ts-node/register'],
  worldParameters: {},
};

export default config;
