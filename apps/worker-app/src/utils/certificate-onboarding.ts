import { WorkerCertificateCard, WorkerCertificateWriteItem } from '@/types/auth';
import { SelectedCertificateFile } from '@/types/onboarding';

function collectStringIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }
  return [];
}

export function getCertificateCardId(card: WorkerCertificateCard) {
  return card.latestCertificateId
    ?? card.workerServiceId
    ?? card.serviceId
    ?? `${card.title ?? 'certificate'}-${card.serviceName ?? 'service'}`;
}

export function isLockedCertificate(card: WorkerCertificateCard) {
  return card.certificateStatus === 'PENDING' || card.certificateStatus === 'APPROVED';
}

export function resolveCertificateWorkerSkillIds(card: WorkerCertificateCard): string[] {
  const asRecord = card as Record<string, unknown>;
  const idCandidates: string[][] = [
    collectStringIds(card.workerSkillIds),
    collectStringIds(card.workerSkillId),
    collectStringIds(asRecord.workerServiceSkillIds),
    collectStringIds(asRecord.workerServiceSkillId),
    collectStringIds(asRecord.worker_service_skill_ids),
    collectStringIds(asRecord.worker_service_skill_id),
    collectStringIds(asRecord.worker_skill_ids),
    collectStringIds(asRecord.worker_skill_id),
    collectStringIds(card.workerServiceIds),
    collectStringIds(card.workerServiceId),
    collectStringIds(asRecord.worker_service_ids),
    collectStringIds(asRecord.worker_service_id),
    collectStringIds(card.serviceIds),
    collectStringIds(card.serviceId),
    collectStringIds(asRecord.service_ids),
    collectStringIds(asRecord.service_id),
  ];
  return idCandidates.find(ids => ids.length > 0) ?? [];
}

export const resolveCertificateServiceIds = resolveCertificateWorkerSkillIds;

export function pickCertificateType(card: WorkerCertificateCard, selectedTypeByCard: Record<string, string>) {
  const cardId = getCertificateCardId(card);
  return selectedTypeByCard[cardId] ?? '';
}

export function isSupportedCertificateFile(name: string, mimeType?: string | null) {
  const normalizedMime = (mimeType ?? '').toLowerCase();
  const normalizedName = name.toLowerCase();
  if (normalizedMime === 'application/pdf') return true;
  if (normalizedMime.startsWith('image/')) {
    return /\.(png|jpe?g)$/i.test(normalizedName);
  }
  return /\.(pdf|png|jpe?g)$/i.test(normalizedName);
}

export function toWorkerCertificateWriteItem(args: {
  card: WorkerCertificateCard;
  certificateType: string;
  file: SelectedCertificateFile;
}): WorkerCertificateWriteItem {
  const { card, certificateType, file } = args;
  const payload: WorkerCertificateWriteItem = {
    certificateId: card.latestCertificateId ?? undefined,
    certificateType,
    workerSkillIds: resolveCertificateWorkerSkillIds(card),
  };

  if (file.fileId) {
    payload.fileId = file.fileId;
    return payload;
  }

  payload.fileName = file.name;
  payload.fileType = file.type;
  payload.fileUrl = file.url;
  return payload;
}
