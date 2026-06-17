import type { WorkerCommissionPayableBlock } from '@/types/worker-finance';
import { parseAmount } from '@/utils/worker-finance';

export function isCommissionPayableCleared(block: WorkerCommissionPayableBlock | null | undefined): boolean {
  if (!block) return true;
  return parseAmount(block.amount) <= 0;
}

export function canShowCommissionOnlinePay(block: WorkerCommissionPayableBlock | null | undefined): boolean {
  if (!block) return false;
  return block.canPayOnline && parseAmount(block.amount) > 0;
}
