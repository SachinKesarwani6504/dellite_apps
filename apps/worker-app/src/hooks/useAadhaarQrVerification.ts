import { useCallback, useMemo, useState } from 'react';
import { saveAadhaarIdentityVerification } from '@/actions';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AadhaarQrParsedData, AadhaarVerificationPhase } from '@/types/aadhaar';
import { parseAadhaarQrPayload } from '@/utils/aadhaar';

type UseAadhaarQrVerificationParams = {
  aadhaarPhotoFileId?: string;
};

function normalizeDob(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month}-${day}`;
  }
  return null;
}

function normalizeGender(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'M' || normalized === 'MALE') return 'MALE';
  if (normalized === 'F' || normalized === 'FEMALE') return 'FEMALE';
  if (normalized === 'T' || normalized === 'TRANSGENDER' || normalized === 'OTHER') return 'OTHER';
  return null;
}

export function useAadhaarQrVerification({ aadhaarPhotoFileId }: UseAadhaarQrVerificationParams = {}) {
  const { syncOnboardingRoute } = useOnboarding();
  const [phase, setPhase] = useState<AadhaarVerificationPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [scannedRawData, setScannedRawData] = useState<string>('');
  const [parsedData, setParsedData] = useState<AadhaarQrParsedData | null>(null);

  const isScannerPaused = useMemo(
    () => phase === 'scanned' || phase === 'verifying' || phase === 'verified',
    [phase],
  );

  const onQrScanned = useCallback((rawData: string) => {
    if (!rawData || isScannerPaused) return;
    setError(null);
    setScannedRawData(rawData);
    setParsedData(parseAadhaarQrPayload(rawData));
    setPhase('scanned');
  }, [isScannerPaused]);

  const resetScan = useCallback(() => {
    setPhase('idle');
    setError(null);
    setScannedRawData('');
    setParsedData(null);
  }, []);

  const verifyScannedData = useCallback(async () => {
    if (!scannedRawData) {
      setError('Scan Aadhaar QR before verification.');
      return;
    }
    const fullName = parsedData?.fullName?.trim();
    const dateOfBirth = normalizeDob(parsedData?.dateOfBirth);
    const gender = normalizeGender(parsedData?.gender);
    const aadhaarLast4 = parsedData?.aadhaarLast4?.replace(/\D/g, '').slice(-4);

    if (!fullName || !dateOfBirth || !gender || !aadhaarLast4) {
      setError('QR payload is missing required Aadhaar fields. Please scan a valid secure QR.');
      return;
    }

    setPhase('verifying');
    setError(null);

    try {
      const verificationReferenceId = `aadhaar_qr_${Date.now()}`;
      const result = await saveAadhaarIdentityVerification({
        aadhaarVerificationReferenceId: verificationReferenceId,
        aadhaarVerificationScore: 95,
        aadhaarVerificationMethod: 'QR_SCAN',
        aadhaarVerificationProvider: 'INTERNAL',
        aadhaarFullName: fullName,
        aadhaarDateOfBirth: dateOfBirth,
        aadhaarGender: gender,
        aadhaarLast4,
        aadhaarMaskedNumber: `XXXX-XXXX-${aadhaarLast4}`,
        // Temporary until file upload flow is added.
        aadhaarPhotoFileId: aadhaarPhotoFileId?.trim() || '',
      });

      if (!result.isVerified) {
        setPhase('failed');
        setError(result.message ?? 'Aadhaar could not be verified. Please scan a valid secure QR.');
        return;
      }

      setPhase('verified');
      await syncOnboardingRoute();
    } catch {
      setPhase('failed');
      setError('Verification request failed. Please retry.');
    }
  }, [aadhaarPhotoFileId, parsedData, scannedRawData, syncOnboardingRoute]);

  return {
    phase,
    error,
    parsedData,
    isScannerPaused,
    onQrScanned,
    verifyScannedData,
    resetScan,
  };
}
