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

function validateApp(appName, appRoot) {
  const srcRoot = path.join(appRoot, 'src');
  const errors = [];

  if (!fs.existsSync(srcRoot)) {
    errors.push(`[${appName}] Missing src directory: ${srcRoot}`);
    return errors;
  }

  const files = walk(srcRoot);

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
