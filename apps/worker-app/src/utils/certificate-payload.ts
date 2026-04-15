import { WorkerCertificateWriteItem } from '@/types/auth';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toNormalizedIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

function filterValidUuids(values: string[]): string[] {
  return values.filter(value => UUID_PATTERN.test(value));
}

export function normalizeCertificatePayload(item: WorkerCertificateWriteItem): WorkerCertificateWriteItem {
  const workerSkillIdsSource = toNormalizedIdArray(item.workerSkillIds);
  const legacyServiceIdsSource = toNormalizedIdArray(item.serviceIds);
  const idsToNormalize = workerSkillIdsSource.length > 0 ? workerSkillIdsSource : legacyServiceIdsSource;
  const workerSkillIds = filterValidUuids(idsToNormalize);

  return {
    certificateId: item.certificateId,
    certificateType: item.certificateType,
    workerSkillIds,
    serviceIds: undefined,
    fileId: item.fileId,
    fileName: item.fileName,
    fileType: item.fileType,
    fileUrl: item.fileUrl,
    fileField: item.fileField,
  };
}

export function validateCertificatePayloadItems(
  items: WorkerCertificateWriteItem[],
  options?: { requireAtLeastOne?: boolean },
) {
  if (options?.requireAtLeastOne && items.length === 0) {
    throw new Error('At least one certificate is required.');
  }

  items.forEach((item, index) => {
    const ids = toNormalizedIdArray(item.workerSkillIds);
    if (ids.length === 0) {
      throw new Error(`workerSkillIds is required for certificate at index ${index}.`);
    }
    const hasInvalidUuid = ids.some(id => !UUID_PATTERN.test(id));
    if (hasInvalidUuid) {
      throw new Error(`workerSkillIds must contain valid UUID values for certificate at index ${index}.`);
    }
  });
}
