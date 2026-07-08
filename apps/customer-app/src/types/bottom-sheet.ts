import type { ReactNode } from 'react';

export type BottomSheetActionTone = 'default' | 'primary' | 'danger';

export type BottomSheetAction = {
  id: string;
  label: string;
  tone?: BottomSheetActionTone;
  disabled?: boolean;
  closeOnPress?: boolean;
  closeOnSuccess?: boolean;
  onPress?: () => void | Promise<void>;
};

export type BottomSheetRenderContext = {
  closeSheet: () => void;
  pendingActionId: string | null;
  scrollToEnd?: (animated?: boolean) => void;
};

export type BottomSheetBaseConfig = {
  title?: string;
  subtitle?: string;
  description?: string;
  dismissible?: boolean;
  snapPoint?: string;
};

export type InfoBottomSheetConfig = BottomSheetBaseConfig & {
  variant: 'info';
  primaryAction?: BottomSheetAction;
  secondaryAction?: BottomSheetAction;
};

export type ConfirmBottomSheetConfig = BottomSheetBaseConfig & {
  variant: 'confirm';
  confirmAction: BottomSheetAction;
  cancelAction?: BottomSheetAction;
};

export type ActionListBottomSheetConfig = BottomSheetBaseConfig & {
  variant: 'action-list';
  actions: BottomSheetAction[];
  footerAction?: BottomSheetAction;
};

export type CustomBottomSheetConfig = BottomSheetBaseConfig & {
  variant: 'custom';
  renderContent: (context: BottomSheetRenderContext) => ReactNode;
  footerActions?: BottomSheetAction[];
};

export type AppBottomSheetConfig =
  | InfoBottomSheetConfig
  | ConfirmBottomSheetConfig
  | ActionListBottomSheetConfig
  | CustomBottomSheetConfig;

export type BottomSheetContextValue = {
  activeSheet: AppBottomSheetConfig | null;
  isVisible: boolean;
  pendingActionId: string | null;
  closeSheet: () => void;
  showBottomSheet: (config: AppBottomSheetConfig) => void;
  showInfoSheet: (config: Omit<InfoBottomSheetConfig, 'variant'>) => void;
  showConfirmSheet: (config: Omit<ConfirmBottomSheetConfig, 'variant'>) => void;
  showActionListSheet: (config: Omit<ActionListBottomSheetConfig, 'variant'>) => void;
  showCustomSheet: (config: Omit<CustomBottomSheetConfig, 'variant'>) => void;
  runAction: (action?: BottomSheetAction) => Promise<void>;
};
