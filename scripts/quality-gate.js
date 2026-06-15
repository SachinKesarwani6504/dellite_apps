const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();

const APPS = {
  worker: path.join(rootDir, 'apps', 'worker-app'),
  customer: path.join(rootDir, 'apps', 'customer-app'),
};

const REQUIRED_PARITY_PATHS = [
  'src/contexts/AuthContext.tsx',
  'src/contexts/OnboardingContext.tsx',
  'src/hooks/useAuthController.ts',
  'src/hooks/useOnboarding.ts',
  'src/actions/http/httpClient.ts',
  'src/utils/toast.tsx',
  'src/utils/appText.ts',
  'src/types/screen-names.ts',
  'src/types/http.ts',
  'src/utils/key-chain-storage/auth-storage.ts',
  'src/utils/key-chain-storage/onboarding-storage.ts',
  'src/utils/key-chain-storage/key-chain-service.ts',
  'src/utils/key-chain-storage/key-chain-values.ts',
];

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const IMPORT_PACKAGE_REGEX =
  /(?:\bimport\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\))/g;

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    runWorker: args.has('--app=worker') || args.has('--worker'),
    runCustomer: args.has('--app=customer') || args.has('--customer'),
  };
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosix(input) {
  return input.split(path.sep).join('/');
}

function ensureFileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getPackageName(importPath) {
  if (
    importPath.startsWith('.') ||
    importPath.startsWith('/') ||
    importPath.startsWith('@/') ||
    importPath.startsWith('node:')
  ) {
    return null;
  }

  if (importPath.startsWith('@')) {
    const [scope, name] = importPath.split('/');
    return scope && name ? `${scope}/${name}` : null;
  }

  return importPath.split('/')[0];
}

function getPackageSourceFiles(appRoot, srcRoot) {
  const files = [];
  const appEntryFiles = ['App.tsx', 'App.ts', 'index.js', 'index.ts'];

  for (const entryFile of appEntryFiles) {
    const fullPath = path.join(appRoot, entryFile);
    if (ensureFileExists(fullPath)) {
      files.push(fullPath);
    }
  }

  if (fs.existsSync(srcRoot)) {
    files.push(...walk(srcRoot).filter((filePath) => SOURCE_EXTENSIONS.has(path.extname(filePath))));
  }

  return files;
}

function validateDeclaredImports(appName, appRoot, srcRoot) {
  const errors = [];
  const packageJsonPath = path.join(appRoot, 'package.json');
  if (!ensureFileExists(packageJsonPath)) {
    errors.push(`[${appName}] Missing package.json`);
    return errors;
  }

  const packageJson = readJson(packageJsonPath);
  const declaredPackages = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);
  const missingPackages = new Map();

  for (const fullPath of getPackageSourceFiles(appRoot, srcRoot)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const relPath = toPosix(path.relative(appRoot, fullPath));
    IMPORT_PACKAGE_REGEX.lastIndex = 0;

    let match;
    while ((match = IMPORT_PACKAGE_REGEX.exec(content)) !== null) {
      const importPath = match[1] ?? match[2] ?? match[3];
      const packageName = getPackageName(importPath);
      if (!packageName || declaredPackages.has(packageName)) {
        continue;
      }

      if (!missingPackages.has(packageName)) {
        missingPackages.set(packageName, new Set());
      }
      missingPackages.get(packageName).add(relPath);
    }
  }

  for (const [packageName, relPaths] of missingPackages.entries()) {
    errors.push(
      `[${appName}] Imported package "${packageName}" is missing from package.json. Used in: ${[...relPaths].sort().join(', ')}`,
    );
  }

  return errors;
}

function validateApp(appName, appRoot) {
  const srcRoot = path.join(appRoot, 'src');
  const errors = [];

  if (!fs.existsSync(srcRoot)) {
    errors.push(`[${appName}] Missing src directory: ${srcRoot}`);
    return errors;
  }

  const files = walk(srcRoot);
  errors.push(...validateDeclaredImports(appName, appRoot, srcRoot));

  for (const fullPath of files) {
    const relPath = toPosix(path.relative(srcRoot, fullPath));
    const baseName = path.basename(fullPath);
    const ext = path.extname(baseName);
    const dirRel = toPosix(path.dirname(relPath));

    const inScreens = relPath.startsWith('screens/');
    const inComponents = relPath.startsWith('components/');
    if ((inScreens || inComponents) && ext === '.tsx' && baseName !== 'index.tsx') {
      if (!/^[A-Z][A-Za-z0-9]*\.tsx$/.test(baseName)) {
        errors.push(`[${appName}] Components/screens must be PascalCase.tsx: ${relPath}`);
      }
    }

    if (relPath.startsWith('hooks/') && (ext === '.ts' || ext === '.tsx')) {
      if (!/^use[A-Z][A-Za-z0-9]*\.(ts|tsx)$/.test(baseName)) {
        errors.push(`[${appName}] Hook files must be useXxx.ts/tsx: ${relPath}`);
      }
      if (baseName === 'useAuth.ts') {
        errors.push(`[${appName}] Wrapper hook is forbidden: ${relPath}. Use useAuthContext directly.`);
      }
    }

    if (relPath.startsWith('contexts/') && ext === '.tsx') {
      if (!/^[A-Z][A-Za-z0-9]*Context\.tsx$/.test(baseName)) {
        errors.push(`[${appName}] Context files must be PascalCaseContext.tsx: ${relPath}`);
      }
    }

    if (relPath.startsWith('types/') && baseName === 'screenNames.ts') {
      errors.push(`[${appName}] Forbidden mixed naming detected: ${relPath}. Use screen-names.ts.`);
    }

    if (inScreens) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/from ['"]axios['"]/.test(content) || /require\(['"]axios['"]\)/.test(content)) {
        errors.push(`[${appName}] Direct axios usage is forbidden inside screens: ${relPath}`);
      }
    }

    void dirRel;
  }

  return errors;
}

function validateParity() {
  const errors = [];
  for (const relPath of REQUIRED_PARITY_PATHS) {
    const workerPath = path.join(APPS.worker, relPath);
    const customerPath = path.join(APPS.customer, relPath);
    const workerExists = ensureFileExists(workerPath);
    const customerExists = ensureFileExists(customerPath);

    if (workerExists !== customerExists) {
      errors.push(
        `[parity] Found mismatch for ${relPath}: worker=${workerExists ? 'present' : 'missing'}, customer=${customerExists ? 'present' : 'missing'}`,
      );
    }
  }

  const forbiddenWrapperWorker = path.join(APPS.worker, 'src', 'hooks', 'useAuth.ts');
  const forbiddenWrapperCustomer = path.join(APPS.customer, 'src', 'hooks', 'useAuth.ts');
  if (ensureFileExists(forbiddenWrapperWorker) || ensureFileExists(forbiddenWrapperCustomer)) {
    errors.push('[parity] Forbidden wrapper hook useAuth.ts exists in one or both apps.');
  }

  return errors;
}

function run() {
  const { runWorker, runCustomer } = parseArgs(process.argv);
  const runAll = !runWorker && !runCustomer;

  let errors = [];

  if (runAll || runWorker) {
    errors = errors.concat(validateApp('worker', APPS.worker));
  }

  if (runAll || runCustomer) {
    errors = errors.concat(validateApp('customer', APPS.customer));
  }

  if (runAll) {
    errors = errors.concat(validateParity());
  }

  if (errors.length > 0) {
    console.error('\nQuality gate failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Quality gate passed.');
}

run();
