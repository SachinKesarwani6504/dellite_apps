# Deployment

## Build & Release Process

### Development

```bash
# Install dependencies
npm install

# Run on iOS simulator
cd apps/worker-app
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm run test
```

### Staging

```bash
# Build staging bundle
npm run build:staging:worker
npm run build:staging:customer

# Deploy to TestFlight (iOS)
npm run deploy:staging:ios

# Deploy to Google Play (Android)
npm run deploy:staging:android
```

### Production

```bash
# Ensure quality gates pass
npm run verify:all

# Build production bundle
npm run build:prod:worker
npm run build:prod:customer

# Deploy to App Store (iOS)
npm run deploy:prod:ios

# Deploy to Google Play (Android)
npm run deploy:prod:android
```

## Environment Configuration

### Expo Config

```
app.config.js              # Shared Expo config
apps/worker-app/
  └── app.config.js        # Worker-specific overrides
apps/customer-app/
  └── app.config.js        # Customer-specific overrides
```

### Environment Files

```
.env.development
.env.staging
.env.production
```

Example:

```
# .env.production
REACT_APP_API_URL=https://api.dellite.com
REACT_APP_ENV=production
EXPO_PUBLIC_FIREBASE_PROJECT_ID=dellite-prod
```

### App Configuration Per Environment

```typescript
// app.config.js
import 'dotenv/config';

export default {
  name: 'Dellite',
  slug: 'dellite',
  version: '1.0.0',
  
  plugins: [
    ['expo-build-properties', {
      android: {
        usesCleartextTraffic: false,
      },
    }],
  ],
  
  // Environment-specific config
  ...(process.env.EAS_BUILD_PROFILE === 'production' && {
    android: {
      versionCode: 1,
    },
  }),
};
```

## Versioning

Follow semantic versioning: `MAJOR.MINOR.PATCH`

Update version in:
- `package.json` (root)
- `apps/worker-app/app.json`
- `apps/customer-app/app.json`

```json
{
  "expo": {
    "version": "1.2.3"
  }
}
```

## Release Checklist

Before release:

- [ ] All tests pass: `npm run verify:all`
- [ ] Lint passes: `npm run lint:repo`
- [ ] Both apps typecheck: `npm run typecheck:worker` + `npm run typecheck:customer`
- [ ] Update version in all files
- [ ] Update `CHANGELOG.md`
- [ ] Firebase config correct for environment
- [ ] API endpoints correct for environment
- [ ] Analytics events tracked correctly
- [ ] Error handling works properly
- [ ] No hardcoded credentials or secrets

## Continuous Integration

### GitHub Actions

```
.github/workflows/
└── quality-gate.yml        # CI pipeline
```

Runs on every PR:

1. Install dependencies
2. Lint code
3. Run tests
4. Build both apps
5. Typecheck both apps
6. Check parity

Must pass before merge.

## Crash Reporting

Firebase Crashlytics is configured to automatically report:

- Unhandled exceptions
- Network errors
- Custom errors

Send custom error:

```typescript
import { logError } from '../lib/firebase/analytics';

try {
  // Code
} catch (error) {
  logError('custom_error', { context: 'booking_flow', error });
}
```

## Monitoring

### Key Metrics

- App startup time
- Screen load times
- API response times
- Error rate by endpoint
- Crash rate by OS version

### Alerts

Configure Firebase alerts for:

- Crash rate > 5%
- API errors > 10%
- Slow screens (> 2s load)

## Database Migrations

For backend schema changes:

1. **Backwards compatible**: Deploy backend first, then app
2. **Breaking change**: Deploy app first with feature flag, then backend

## Rollback Plan

If production deployment fails:

1. Revert to previous version in App Store/Play Store
2. Notify users of issue
3. Fix bug in development
4. Re-test thoroughly
5. Re-deploy

## Related Documentation

- **Quality Gate**: CI/CD pipeline → [root quality-gate.js](../../scripts/quality-gate.js)
- **Architecture**: Deployment-related settings → [/docs/architecture](../architecture/index.md)
- **Firebase**: Firebase config per environment → [/docs/firebase](../firebase/index.md)
