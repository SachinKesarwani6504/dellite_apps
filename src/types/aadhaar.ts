export type AadhaarQrParsedData = {
  raw: string;
  format: 'XML' | 'JSON' | 'TEXT';
  fullName?: string;
  dateOfBirth?: string;
  yearOfBirth?: string;
  gender?: string;
  aadhaarLast4?: string;
  pinCode?: string;
};

export type AadhaarVerificationPhase =
  | 'idle'
  | 'scanned'
  | 'verifying'
  | 'verified'
  | 'failed';
