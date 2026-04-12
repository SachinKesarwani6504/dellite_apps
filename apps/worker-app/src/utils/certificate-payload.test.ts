import { normalizeCertificatePayload } from '@/utils/certificate-payload';

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testCreatePayloadUsesWorkerSkillIds() {
  const normalized = normalizeCertificatePayload({
    certificateType: 'BEAUTY_WELLNESS_CERTIFICATE',
    workerSkillIds: [UUID_A, UUID_B],
    fileId: 'file-uuid-1',
  });

  assert(Array.isArray(normalized.workerSkillIds), 'workerSkillIds should be present.');
  assert(normalized.workerSkillIds?.length === 2, 'workerSkillIds should keep all valid IDs.');
}

function testUpdatePayloadUsesWorkerSkillIds() {
  const normalized = normalizeCertificatePayload({
    certificateId: 'certificate-uuid-1',
    certificateType: 'BEAUTY_WELLNESS_CERTIFICATE',
    workerSkillIds: [UUID_A],
    fileId: 'file-uuid-1',
  });

  assert(normalized.certificateId === 'certificate-uuid-1', 'certificateId should be preserved.');
  assert(normalized.workerSkillIds?.[0] === UUID_A, 'workerSkillIds should be retained for updates.');
}

// Test entrypoint for future test-runner wiring.
export function runCertificatePayloadTests() {
  testCreatePayloadUsesWorkerSkillIds();
  testUpdatePayloadUsesWorkerSkillIds();
}
