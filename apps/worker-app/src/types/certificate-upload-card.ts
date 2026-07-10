import type { WorkerCertificateCard } from '@/types/auth';
import type { SelectedCertificateFile } from '@/types/onboarding';

export type CertificateUploadCardProps = {
  card: WorkerCertificateCard;
  selectedType: string;
  selectedFile?: SelectedCertificateFile;
  isViewOnly: boolean;
  isPicking: boolean;
  disabled?: boolean;
  isDark: boolean;
  showTypeError?: boolean;
  onSelectType: (type: string) => void;
  onPickFile: () => void;
};
