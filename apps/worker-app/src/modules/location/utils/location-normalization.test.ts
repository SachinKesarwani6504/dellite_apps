import { normalizeCityName } from '@/utils/location';

function assertEqual(actual: string, expected: string, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. expected=${expected} actual=${actual}`);
  }
}

export function runLocationNormalizationTests() {
  assertEqual(normalizeCityName('CHITRAKOOT DIVISION'), 'CHITRAKOOT', 'division suffix should be removed');
  assertEqual(normalizeCityName('PRAYAGRAJ DISTRICT'), 'PRAYAGRAJ', 'district suffix should be removed');
  assertEqual(normalizeCityName('LUCKNOW REGION'), 'LUCKNOW', 'region suffix should be removed');
  assertEqual(normalizeCityName('VARANASI'), 'VARANASI', 'plain city should be preserved');
  assertEqual(normalizeCityName('  CHITRAKOOT   DIVISION  '), 'CHITRAKOOT', 'extra spaces should collapse before suffix removal');
}
