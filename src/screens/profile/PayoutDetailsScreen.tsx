import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { createUserBankInfo, getUserBankInfo, updateUserBankInfo } from '@/actions';
import { AppSpinner } from '@/components/common/AppSpinner';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { AppInput } from '@/components/common/AppInput';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { PayoutMethodType, UserBankInfo } from '@/types/auth';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { formatDateToDdMmmYyyy } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.payoutDetails>;

type FieldErrors = {
  upiId?: string;
  accountHolderName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
};

function mapBankInfoToForm(
  bankInfo: UserBankInfo | null,
): {
  methodType: PayoutMethodType;
  accountHolderName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  upiId: string;
} {
  return {
    methodType: bankInfo?.methodType === 'BANK_ACCOUNT' ? 'BANK_ACCOUNT' : 'UPI',
    accountHolderName: String(bankInfo?.accountHolderName ?? ''),
    bankAccountNumber: String(bankInfo?.bankAccountNumber ?? ''),
    bankIfscCode: String(bankInfo?.bankIfscCode ?? ''),
    upiId: String(bankInfo?.upiId ?? ''),
  };
}

export function PayoutDetailsScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState<UserBankInfo | null>(null);
  const [methodType, setMethodType] = useState<PayoutMethodType>('UPI');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const formLocked = saveLoading;
  const hasExistingBankInfo = Boolean(bankInfo?.id);
  const updatedAtLabel = bankInfo?.updatedAt
    ? `${APP_TEXT.profile.payout.updatedAtPrefix}${formatDateToDdMmmYyyy(bankInfo.updatedAt)}`
    : null;

  const loadBankInfo = useCallback(async (showLoader: boolean) => {
    if (showLoader) {
      setFetchLoading(true);
    }
    try {
      const next = await getUserBankInfo();
      setBankInfo(next);
      const mapped = mapBankInfoToForm(next);
      setMethodType(mapped.methodType);
      setAccountHolderName(mapped.accountHolderName);
      setBankAccountNumber(mapped.bankAccountNumber);
      setBankIfscCode(mapped.bankIfscCode);
      setUpiId(mapped.upiId);
      setErrors({});
    } catch {
      setBankInfo(null);
      setMethodType('UPI');
      setAccountHolderName('');
      setBankAccountNumber('');
      setBankIfscCode('');
      setUpiId('');
      setErrors({});
    } finally {
      if (showLoader) {
        setFetchLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadBankInfo(true);
  }, [loadBankInfo]);

  const validate = useCallback((): FieldErrors => {
    const nextErrors: FieldErrors = {};

    if (methodType === 'UPI') {
      if (!upiId.trim()) {
        nextErrors.upiId = APP_TEXT.profile.payout.upiRequired;
      }
      return nextErrors;
    }

    if (!accountHolderName.trim()) {
      nextErrors.accountHolderName = APP_TEXT.profile.payout.accountHolderRequired;
    }
    if (!bankAccountNumber.trim()) {
      nextErrors.bankAccountNumber = APP_TEXT.profile.payout.accountRequired;
    }
    if (!bankIfscCode.trim()) {
      nextErrors.bankIfscCode = APP_TEXT.profile.payout.ifscRequired;
    }

    return nextErrors;
  }, [accountHolderName, bankAccountNumber, bankIfscCode, methodType, upiId]);

  const handleSave = useCallback(async () => {
    if (fetchLoading || formLocked) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = methodType === 'UPI'
      ? {
        methodType: 'UPI' as const,
        upiId: upiId.trim(),
      }
      : {
        methodType: 'BANK_ACCOUNT' as const,
        accountHolderName: accountHolderName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfscCode: bankIfscCode.trim().toUpperCase(),
      };

    setSaveLoading(true);
    try {
      const next = hasExistingBankInfo
        ? await updateUserBankInfo(payload)
        : await createUserBankInfo(payload);
      setBankInfo(next);
      const mapped = mapBankInfoToForm(next);
      setMethodType(mapped.methodType);
      setAccountHolderName(mapped.accountHolderName);
      setBankAccountNumber(mapped.bankAccountNumber);
      setBankIfscCode(mapped.bankIfscCode);
      setUpiId(mapped.upiId);
      setErrors({});
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(PROFILE_SCREENS.home);
      }
    } finally {
      setSaveLoading(false);
    }
  }, [
    accountHolderName,
    bankAccountNumber,
    bankIfscCode,
    fetchLoading,
    formLocked,
    hasExistingBankInfo,
    methodType,
    navigation,
    upiId,
    validate,
  ]);

  const contentCardStyle = useMemo(
    () => ({
      backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card,
    }),
    [isDark],
  );

  const hintCardStyle = useMemo(
    () => ({
      backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
      borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
    }),
    [isDark],
  );

  return (
    <GradientScreen contentContainerStyle={{ flexGrow: 1, paddingBottom: 24, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}>
      <View className="mb-3">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>

      <View className="rounded-3xl pb-6 pt-4" style={contentCardStyle}>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
          <Text className="text-xs font-bold tracking-widest text-primary">PAYOUT SETUP</Text>
        </View>

        <Text className="mt-3 text-[36px] font-extrabold leading-[38px] text-baseDark dark:text-white">
          Manage your
        </Text>
        <View className="mt-0.5">
          <GradientWord word="bank info" />
        </View>

        <Text className="mt-1 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.profile.payout.subtitle}
        </Text>

        {fetchLoading ? (
          <View className="items-center py-10">
            <AppSpinner size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View className="mt-5">
            <Text className="mb-2 text-sm font-semibold text-baseDark dark:text-white">
              {APP_TEXT.profile.payout.methodTypeLabel}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  if (formLocked) return;
                  setMethodType('UPI');
                  setErrors(prev => ({ ...prev, upiId: undefined }));
                }}
                disabled={formLocked}
                className={`flex-1 items-center rounded-xl border px-3 py-3 ${formLocked ? 'opacity-60' : ''}`}
                style={{
                  borderColor: methodType === 'UPI'
                    ? theme.colors.primary
                    : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight),
                  backgroundColor: methodType === 'UPI'
                    ? uiColors.surface.accentSoft20
                    : (isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight),
                }}
              >
                <Text className={`text-sm font-semibold ${methodType === 'UPI' ? 'text-primary' : 'text-textPrimary dark:text-white'}`}>
                  {APP_TEXT.profile.payout.upiOption}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (formLocked) return;
                  setMethodType('BANK_ACCOUNT');
                  setErrors(prev => ({
                    ...prev,
                    accountHolderName: undefined,
                    bankAccountNumber: undefined,
                    bankIfscCode: undefined,
                  }));
                }}
                disabled={formLocked}
                className={`flex-1 items-center rounded-xl border px-3 py-3 ${formLocked ? 'opacity-60' : ''}`}
                style={{
                  borderColor: methodType === 'BANK_ACCOUNT'
                    ? theme.colors.primary
                    : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight),
                  backgroundColor: methodType === 'BANK_ACCOUNT'
                    ? uiColors.surface.accentSoft20
                    : (isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight),
                }}
              >
                <Text className={`text-sm font-semibold ${methodType === 'BANK_ACCOUNT' ? 'text-primary' : 'text-textPrimary dark:text-white'}`}>
                  {APP_TEXT.profile.payout.bankOption}
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 gap-3">
              {methodType === 'UPI' ? (
                <View>
                  <AppInput
                    label={APP_TEXT.profile.payout.upiLabel}
                    isRequired
                    value={upiId}
                    onChangeText={value => {
                      setUpiId(value);
                      if (errors.upiId) {
                        setErrors(prev => ({ ...prev, upiId: undefined }));
                      }
                    }}
                    placeholder={APP_TEXT.profile.payout.upiPlaceholder}
                    editable={!formLocked}
                    hasError={Boolean(errors.upiId)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {errors.upiId ? <Text className="mt-1 text-xs text-negative">{errors.upiId}</Text> : null}
                </View>
              ) : (
                <>
                  <View>
                    <AppInput
                      label={APP_TEXT.profile.payout.accountHolderLabel}
                      isRequired
                      value={accountHolderName}
                      onChangeText={value => {
                        setAccountHolderName(value);
                        if (errors.accountHolderName) {
                          setErrors(prev => ({ ...prev, accountHolderName: undefined }));
                        }
                      }}
                      placeholder={APP_TEXT.profile.payout.accountHolderPlaceholder}
                      editable={!formLocked}
                      hasError={Boolean(errors.accountHolderName)}
                    />
                    {errors.accountHolderName ? <Text className="mt-1 text-xs text-negative">{errors.accountHolderName}</Text> : null}
                  </View>

                  <View>
                    <AppInput
                      label={APP_TEXT.profile.payout.accountLabel}
                      isRequired
                      value={bankAccountNumber}
                      onChangeText={value => {
                        const digitsOnly = value.replace(/[^\d]/g, '');
                        setBankAccountNumber(digitsOnly);
                        if (errors.bankAccountNumber) {
                          setErrors(prev => ({ ...prev, bankAccountNumber: undefined }));
                        }
                      }}
                      placeholder={APP_TEXT.profile.payout.accountPlaceholder}
                      editable={!formLocked}
                      hasError={Boolean(errors.bankAccountNumber)}
                      keyboardType="number-pad"
                    />
                    {errors.bankAccountNumber ? <Text className="mt-1 text-xs text-negative">{errors.bankAccountNumber}</Text> : null}
                  </View>

                  <View>
                    <AppInput
                      label={APP_TEXT.profile.payout.ifscLabel}
                      isRequired
                      value={bankIfscCode}
                      onChangeText={value => {
                        setBankIfscCode(value.toUpperCase());
                        if (errors.bankIfscCode) {
                          setErrors(prev => ({ ...prev, bankIfscCode: undefined }));
                        }
                      }}
                      placeholder={APP_TEXT.profile.payout.ifscPlaceholder}
                      editable={!formLocked}
                      hasError={Boolean(errors.bankIfscCode)}
                      autoCapitalize="characters"
                    />
                    {errors.bankIfscCode ? <Text className="mt-1 text-xs text-negative">{errors.bankIfscCode}</Text> : null}
                  </View>
                </>
              )}
            </View>

            <View className="mt-4 rounded-xl border p-3" style={hintCardStyle}>
              <View className="flex-row items-start">
                <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
                <Text className="ml-2 flex-1 text-xs leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {methodType === 'UPI' ? APP_TEXT.profile.payout.upiHint : APP_TEXT.profile.payout.bankHint}
                </Text>
              </View>
            </View>

            {updatedAtLabel ? (
              <Text className="mt-3 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {updatedAtLabel}
              </Text>
            ) : null}
          </View>
        )}

        <View className="mt-5">
          <Button
            label={hasExistingBankInfo ? APP_TEXT.profile.payout.updateButton : APP_TEXT.profile.payout.createButton}
            onPress={() => {
              void handleSave();
            }}
            loading={saveLoading}
            disabled={fetchLoading || formLocked}
          />
        </View>
      </View>
    </GradientScreen>
  );
}

