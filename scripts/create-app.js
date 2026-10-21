#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { execSync } = require('node:child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function toKebabCase(str) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toConstantCase(str) {
  return str.toUpperCase().replace(/[-\s]+/g, '_');
}

function validateAppName(name) {
  if (!name || name.trim() === '') {
    return 'App name cannot be empty';
  }
  if (!/^[a-zA-Z0-9-_\s]+$/.test(name)) {
    return 'App name can only contain letters, numbers, hyphens, underscores, and spaces';
  }
  return null;
}

function createDirectoryStructure(appPath) {
  const dirs = [
    appPath,
    path.join(appPath, 'public'),
    path.join(appPath, 'public', 'locales'),
    path.join(appPath, 'src'),
    path.join(appPath, 'src', 'components'),
    path.join(appPath, 'src', 'config'),
    path.join(appPath, 'src', 'constants'),
    path.join(appPath, 'src', 'hooks'),
    path.join(appPath, 'src', 'pages'),
    path.join(appPath, 'src', 'routes'),
    path.join(appPath, 'src', 'services'),
    path.join(appPath, 'src', 'types'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getPackageJsonTemplate(appNameKebab) {
  return JSON.stringify(
    {
      name: `@bahmni/${appNameKebab}-app`,
      version: '0.0.1',
      type: 'module',
      main: './dist/index.js',
      module: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        './package.json': './package.json',
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
          default: './dist/index.js',
        },
        './styles': './dist/index.css',
        './locales/*': './dist/locales/*',
      },
      peerDependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'react-router-dom': '^7.5.3',
      },
      "author": "Thoughtworks Inc.",
      "license": "MPL-2.0",
      "files": [
        "dist",
        "README.md",
        "LICENSE"
      ]
    },
    null,
    2,
  );
}

function getBabelrcTemplate() {
  return JSON.stringify(
    {
      presets: [
        [
          '@nx/react/babel',
          {
            runtime: 'automatic',
            useBuiltIns: 'usage',
          },
        ],
      ],
      plugins: [],
    },
    null,
    2,
  );
}

function getEslintConfigTemplate() {
  return `import baseConfig from "../../eslint.config.js";

export default [
    ...baseConfig
];
`;
}

function getJestConfigTemplate(appNameKebab) {
  return String.raw`export default {
  displayName: '@bahmni/${appNameKebab}',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(@bahmni/design-system|@bahmni/services)/)',
  ],
  moduleNameMapper: {
    '^i18next$': '<rootDir>/../../node_modules/i18next',
    '^react-i18next$': '<rootDir>/../../node_modules/react-i18next',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
};
`;
}

function getTsconfigJsonTemplate() {
  return JSON.stringify(
    {
      files: [],
      include: [],
      references: [
        {
          path: '../../packages/services',
        },
        {
          path: './tsconfig.lib.json',
        },
        {
          path: './tsconfig.spec.json',
        },
      ],
      extends: '../../tsconfig.base.json',
    },
    null,
    2,
  );
}

function getTsconfigLibJsonTemplate() {
  return JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        outDir: 'dist',
        types: [
          'node',
          '@nx/react/typings/cssmodule.d.ts',
          '@nx/react/typings/image.d.ts',
          'vite/client',
        ],
        rootDir: 'src',
        jsx: 'react-jsx',
        lib: ['dom'],
        tsBuildInfoFile: 'dist/tsconfig.lib.tsbuildinfo',
      },
      exclude: [
        'dist',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/*.test.tsx',
        '**/*.spec.js',
        '**/*.test.js',
        '**/*.spec.jsx',
        '**/*.test.jsx',
        'jest.config.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'eslint.config.js',
        'eslint.config.cjs',
        'eslint.config.ts',
      ],
      include: [
        'src/**/*.js',
        'src/**/*.jsx',
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.json',
      ],
      references: [
        {
          path: '../../packages/services/tsconfig.lib.json',
        },
      ],
    },
    null,
    2,
  );
}

function getTsconfigSpecJsonTemplate() {
  return JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        jsx: 'react-jsx',
        lib: ['dom'],
        types: ['jest', 'node'],
      },
      include: [
        '@testing-library/jest-dom',
        'jest.config.ts',
        'setupTests.ts',
        'setupTests.i18n.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.tsx',
        'src/**/*.spec.tsx',
        'src/**/*.test.js',
        'src/**/*.spec.js',
        'src/**/*.test.jsx',
        'src/**/*.spec.jsx',
        'src/**/*.d.ts',
      ],
      references: [
        {
          path: './tsconfig.lib.json',
        },
      ],
    },
    null,
    2,
  );
}

function getViteConfigTemplate(appNameKebab) {
  return `/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'node:path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/${appNameKebab}',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  publicDir: 'public',
  css: {
    modules: {
      generateScopedName: '[name]_[local]__[hash:base64:5]',
    },
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    copyPublicDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: '@bahmni/${appNameKebab}',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        /^@carbon\/styles/
      ],
    },
  },
}));
`;
}

function getReadmeTemplate(appNameKebab, appNamePascal) {
  return `# @bahmni/${appNameKebab}

${appNamePascal} application for Bahmni.
`;
}

function getSetupTestsTemplate() {
  return `import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';
import { initFontAwesome } from '@bahmni/design-system';
import { toHaveNoViolations } from 'jest-axe';
import './setupTests.i18n';

expect.extend(toHaveNoViolations);

initFontAwesome();

// @ts-expect-error - Ignoring type issues with Node.js util TextEncoder
globalThis.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
globalThis.TextDecoder = TextDecoder;
`;
}

function getSetupTestsI18nTemplate(appConstantName, appNameKebab) {
  return `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './public/locales/locale_en.json';
import { ${appConstantName} } from './src/constants/app';

const initTestI18n = () => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    ns: [${appConstantName}],
    defaultNS: ${appConstantName},
    resources: {
      en: { [${appConstantName}]: enTranslations },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

export default initTestI18n();
`;
}

function getConstantsAppTemplate(appConstantName, appNamespace) {
  return `export const ${appConstantName} = '${appNamespace}';
`;
}

function getIndexTsTemplate(appNamePascal) {
  return `import { ${appNamePascal}App } from './App';
import '@bahmni/widgets/styles';
import './styles.scss';

export { ${appNamePascal}App };
`;
}

function getAppTsxTemplate(appConstantName, appNamePascal) {
  return `import { Loading, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, useEffect, useState } from 'react';
import { Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { ${appConstantName} } from './constants/app';
import { routes, renderRoutes } from './routes';

const queryClient = new QueryClient(queryClientConfig);

export function ${appNamePascal}App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(${appConstantName});
        initFontAwesome();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <Loading />;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <UserPrivilegeProvider>
          <NotificationServiceComponent />
          <Suspense fallback={<Loading />}>
            <Routes>{renderRoutes(routes)}</Routes>
          </Suspense>
          <ReactQueryDevtools initialIsOpen={false} />
        </UserPrivilegeProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default ${appNamePascal}App;
`;
}

function getTanstackQueryConfigTemplate() {
  return `import { QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount) => {
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
    },
  },
};
`;
}

function getRouteModelTemplate() {
  return `import { ComponentType, LazyExoticComponent } from 'react';

export interface RouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType<any>>;
  name: string;
}

export type Routes = RouteConfig[];
`;
}

function getRoutesIndexTemplate() {
  return `import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const IndexPage = lazy(() =>
  import('../pages/Index').then((module) => ({ default: module.IndexPage })),
);

export const routes: Routes = [
  {
    path: '/',
    component: IndexPage,
    name: 'Index',
  },
];

export const renderRoutes = (routeConfigs: Routes) => {
  return [
    ...routeConfigs.map((route: RouteConfig) => (
      <Route key={route.path} path={route.path} element={<route.component />} />
    )),
    <Route key="not-found" path="*" element={<Navigate to="/" replace />} />,
  ];
};
`;
}

function getIndexPageTemplate(appNamePascal) {
  return `export function IndexPage() {
  return (
    <div>
      <h1>Welcome to ${appNamePascal}</h1>
      <p>${appNamePascal} application for Bahmni</p>
    </div>
  );
}
`;
}

function patchDistroAppTsx(distroPath, appNameKebab, appNamePascal) {
  const filePath = path.join(distroPath, 'src/app/app.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(`@bahmni/${appNameKebab}-app`)) {
    console.log(`  ${colors.green}✔${colors.reset} distro/src/app/app.tsx skipped (already wired)`);
    return;
  }

  const lazyImport = `const ${appNamePascal}App = lazy(() =>
  import('@bahmni/${appNameKebab}-app').then((module) => ({
    default: module.${appNamePascal}App,
  })),
);\n`;
  const withLazy = content.replace('\nexport function App()', `\n${lazyImport}\nexport function App()`);
  if (withLazy === content) throw new Error(`Pattern not found in ${filePath}: could not insert lazy import`);
  content = withLazy;

  const route = `          <Route path="/${appNameKebab}/*" element={<${appNamePascal}App />} />\n`;
  const withRoute = content.replace('          <Route path="*"', `${route}          <Route path="*"`);
  if (withRoute === content) throw new Error(`Pattern not found in ${filePath}: could not insert route`);
  content = withRoute;

  fs.writeFileSync(filePath, content);
}

function patchDistroWebpackConfig(distroPath, appNameKebab) {
  const filePath = path.join(distroPath, 'webpack.config.js');
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(`@bahmni/${appNameKebab}-app`)) {
    console.log(`  ${colors.green}✔${colors.reset} distro/webpack.config.js skipped (already wired)`);
    return;
  }

  const withAlias = content.replace(
    '      } : {},',
    `        '@bahmni/${appNameKebab}-app': join(__dirname, '../apps/${appNameKebab}/src'),\n      } : {},`,
  );
  if (withAlias === content) throw new Error(`Pattern not found in ${filePath}: could not insert webpack alias`);
  content = withAlias;

  const newAsset = `          { input: isDevelopment ? '../apps/${appNameKebab}/public/locales' : '../apps/${appNameKebab}/dist/locales', glob: '**/*', output: '${appNameKebab}/locales' },`;
  const withAsset = content.replace(
    '\n        ],\n        styles:',
    `\n${newAsset}\n        ],\n        styles:`,
  );
  if (withAsset === content) throw new Error(`Pattern not found in ${filePath}: could not insert asset entry`);
  content = withAsset;

  fs.writeFileSync(filePath, content);
}

function patchDistroTsconfig(distroPath, appNameKebab) {
  const filePath = path.join(distroPath, 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const appRef = { path: `../apps/${appNameKebab}` };
  const insertBeforeIndex = tsconfig.references.findIndex(
    (ref) => ref.path === './tsconfig.app.json',
  );

  if (insertBeforeIndex === -1) {
    console.log(`  ${colors.yellow}⚠${colors.reset} tsconfig.app.json reference not found — appending reference to end`);
    tsconfig.references.push(appRef);
  } else {
    tsconfig.references.splice(insertBeforeIndex, 0, appRef);
  }

  fs.writeFileSync(filePath, JSON.stringify(tsconfig, null, 2) + '\n');
}

function patchDistroFiles(distroPath, appNameKebab, appNamePascal) {
  const patches = [
    ['distro/src/app/app.tsx', () => patchDistroAppTsx(distroPath, appNameKebab, appNamePascal)],
    ['distro/webpack.config.js', () => patchDistroWebpackConfig(distroPath, appNameKebab)],
    ['distro/tsconfig.json', () => patchDistroTsconfig(distroPath, appNameKebab)],
  ];

  for (const [fileName, patch] of patches) {
    try {
      patch();
      console.log(`  ${colors.green}✔${colors.reset} ${fileName}`);
    } catch (error) {
      console.log(`  ${colors.red}✘${colors.reset} ${fileName} — ${error.message}`);
    }
  }
}

function createAllFiles(appPath, transforms) {
  const {
    appNameKebab,
    appNamePascal,
    appConstantName,
    appNamespace,
  } = transforms;

  const files = [
    { path: 'package.json', content: getPackageJsonTemplate(appNameKebab) },
    { path: '.babelrc', content: getBabelrcTemplate() },
    { path: 'eslint.config.ts', content: getEslintConfigTemplate() },
    { path: 'jest.config.ts', content: getJestConfigTemplate(appNameKebab) },
    { path: 'tsconfig.json', content: getTsconfigJsonTemplate() },
    { path: 'tsconfig.lib.json', content: getTsconfigLibJsonTemplate() },
    { path: 'tsconfig.spec.json', content: getTsconfigSpecJsonTemplate() },
    { path: 'vite.config.ts', content: getViteConfigTemplate(appNameKebab) },
    {
      path: 'README.md',
      content: getReadmeTemplate(appNameKebab, appNamePascal),
    },
    { path: 'setupTests.ts', content: getSetupTestsTemplate() },
    {
      path: 'setupTests.i18n.ts',
      content: getSetupTestsI18nTemplate(appConstantName, appNameKebab),
    },
    {
      path: 'src/constants/app.ts',
      content: getConstantsAppTemplate(appConstantName, appNamespace),
    },
    { path: 'src/index.ts', content: getIndexTsTemplate(appNamePascal) },
    {
      path: 'src/App.tsx',
      content: getAppTsxTemplate(appConstantName, appNamePascal),
    },
    {
      path: 'src/config/tanstackQuery.ts',
      content: getTanstackQueryConfigTemplate(),
    },
    { path: 'src/routes/model.ts', content: getRouteModelTemplate() },
    { path: 'src/routes/index.tsx', content: getRoutesIndexTemplate() },
    {
      path: 'src/pages/Index.tsx',
      content: getIndexPageTemplate(appNamePascal),
    },
    { path: 'src/styles.scss', content: '// App global styles\n' },
    { path: 'public/locales/locale_en.json', content: '{}' },
    { path: 'public/locales/locale_es.json', content: '{}' },
  ];

  files.forEach((file) => {
    const filePath = path.join(appPath, file.path);
    fs.writeFileSync(filePath, file.content);
    console.log(`  ${colors.green}✔${colors.reset} ${file.path}`);
  });
}

async function main() {
  console.log('\nBahmni App Generator\n');

  const appNameInput = await question('Enter app name: ');

  const validationError = validateAppName(appNameInput);
  if (validationError) {
    console.error(
      `\n${colors.red}✘ Error:${colors.reset} ${validationError}\n`,
    );
    rl.close();
    process.exit(1);
  }

  const appNameKebab = toKebabCase(appNameInput.trim());
  const appNamePascal = toPascalCase(appNameInput.trim());
  const appNameCamel = toCamelCase(appNameInput.trim());
  const appConstantName = `BAHMNI_${toConstantCase(appNameInput.trim())}_NAMESPACE`;
  const appNamespace = `${appNameKebab}`;

  console.log('\nConfiguration:');
  console.log(`  Name: ${appNameKebab}`);
  console.log(`  Component: ${appNamePascal}`);
  console.log(`  Namespace: ${appConstantName}`);
  console.log(`  Location: apps/${appNameKebab}`);

  const appsDir = path.join(process.cwd(), 'apps');
  const appPath = path.join(appsDir, appNameKebab);

  if (fs.existsSync(appPath)) {
    console.error(
      `\n${colors.red}✘ Error:${colors.reset} Application already exists at apps/${appNameKebab}\n`,
    );
    rl.close();
    process.exit(1);
  }

  const confirm = await question('\nProceed with creation? [Y/n]: ');

  if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
    console.log(`\n${colors.yellow}Operation cancelled${colors.reset}\n`);
    rl.close();
    process.exit(0);
  }

  console.log('\nCreating directory structure...');
  createDirectoryStructure(appPath);

  console.log('\nGenerating files:');
  createAllFiles(appPath, {
    appNameKebab,
    appNamePascal,
    appNameCamel,
    appConstantName,
    appNamespace,
  });

  const distroPath = path.join(process.cwd(), 'distro');
  console.log('\nWiring up distro:');
  patchDistroFiles(distroPath, appNameKebab, appNamePascal);

  const rootDir = process.cwd();

  let installSuccess = true;
  let buildSuccess = true;

  console.log('\nInstalling dependencies...');
  try {
    execSync('yarn install -W', { cwd: rootDir, stdio: 'inherit' });
    console.log(`  ${colors.green}✔${colors.reset} yarn install`);
  } catch (error) {
    console.log(`  ${colors.red}✘${colors.reset} yarn install failed — ${error.message}`);
    installSuccess = false;
  }

  console.log('\nBuilding...');
  try {
    execSync('yarn build', { cwd: rootDir, stdio: 'inherit' });
    console.log(`  ${colors.green}✔${colors.reset} yarn build`);
  } catch (error) {
    console.log(`  ${colors.red}✘${colors.reset} yarn build failed — ${error.message}`);
    buildSuccess = false;
  }

  if (installSuccess && buildSuccess) {
    console.log(`\n${colors.green}✔${colors.reset} Application created successfully\n`);
  } else {
    console.log(`\n${colors.yellow}⚠${colors.reset} Application created with warnings. Please check the errors above.\n`);
  }

  rl.close();
}

main().catch((error) => {
  console.error(`\n${colors.red}✘ Error:${colors.reset} ${error.message}\n`);
  rl.close();
  process.exit(1);
});
