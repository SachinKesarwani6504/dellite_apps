import { AadhaarQrParsedData } from '@/types/aadhaar';

function normalizeGender(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'M' || normalized === 'MALE') return 'MALE';
  if (normalized === 'F' || normalized === 'FEMALE') return 'FEMALE';
  if (normalized === 'T' || normalized === 'TRANSGENDER' || normalized === 'OTHER') return 'OTHER';
  return value;
}

function extractLast4(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return undefined;
  return digits.slice(-4);
}

function extractXmlAttributes(xml: string) {
  const attributes: Record<string, string> = {};
  const attributeRegex = /([a-zA-Z0-9_:-]+)\s*=\s*"([^"]*)"/g;
  let match = attributeRegex.exec(xml);
  while (match) {
    attributes[match[1]] = match[2];
    match = attributeRegex.exec(xml);
  }
  return attributes;
}

export function parseAadhaarQrPayload(rawPayload: string): AadhaarQrParsedData {
  const raw = rawPayload.trim();

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        raw,
        format: 'JSON',
        fullName: typeof parsed.name === 'string' ? parsed.name : undefined,
        dateOfBirth: typeof parsed.dob === 'string' ? parsed.dob : undefined,
        yearOfBirth: typeof parsed.yob === 'string' ? parsed.yob : undefined,
        gender: normalizeGender(typeof parsed.gender === 'string' ? parsed.gender : undefined),
        aadhaarLast4: extractLast4(typeof parsed.uid === 'string' ? parsed.uid : undefined),
        pinCode: typeof parsed.pc === 'string' ? parsed.pc : undefined,
      };
    } catch {
      // Continue with text parsing fallback.
    }
  }

  if (raw.startsWith('<') && raw.includes('uid=')) {
    const attributes = extractXmlAttributes(raw);
    return {
      raw,
      format: 'XML',
      fullName: attributes.name,
      dateOfBirth: attributes.dob,
      yearOfBirth: attributes.yob,
      gender: normalizeGender(attributes.gender),
      aadhaarLast4: extractLast4(attributes.uid),
      pinCode: attributes.pc,
    };
  }

  const aadhaarMatch = raw.match(/\b\d{12}\b/);
  return {
    raw,
    format: 'TEXT',
    aadhaarLast4: aadhaarMatch ? aadhaarMatch[0].slice(-4) : undefined,
  };
}
