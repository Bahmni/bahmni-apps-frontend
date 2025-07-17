module.exports = {
  default: {
    features: ['*.feature'],
    require: ['src/__tests__/step_definitions/**/*.js'],
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
    worldParameters: {},
  }
};
