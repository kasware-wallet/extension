import log from 'loglevel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ITxInfo, TPendingTxType } from '@/shared/types';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, shortAddress, sleepSecond } from '@/ui/utils';
import { CheckCircleFilled } from '@ant-design/icons';

import { useTools } from '../ActionComponent';
import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Input } from '../Input';
import { LoadingSpinner } from '../LoadingSpinner';
import { Row } from '../Row';
import { Text } from '../Text';

interface TxListCardProps {
  e: ITxInfo;
  handleReplaceTransaction: (id: string, txFee: number) => Promise<void>;
}

// Fee preset options
const FEE_PRESETS = [
  { label: '+0.01', value: 0.01 },
  { label: '+0.05', value: 0.05 },
  { label: '+0.1', value: 0.1 }
];

// Validate if the input fee is valid
function isValidFeeInput(value: string): boolean {
  if (!value || value === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && /^\d*\.?\d{0,8}$/.test(value);
}

export function TxListCard({ e, handleReplaceTransaction }: TxListCardProps) {
  const { t } = useTranslation();
  const kasTick = useAppSelector(selectKasTick);
  const tools = useTools();

  const [newTxFee, setNewTxFee] = useState<string>('0.01');
  const [pending, setPending] = useState<boolean>(false);
  const [showRBFFeature, setShowRBFFeature] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Clear error messages
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 10000);
    return () => clearTimeout(timer);
  }, [error]);

  // Calculate current total fee
  const currentTotalFee = useMemo(() => {
    const originalFee = parseFloat(e?.txFee?.toString() || '0');
    const additionalFee = parseFloat(newTxFee || '0');
    return originalFee + additionalFee;
  }, [e?.txFee, newTxFee]);

  // Validate input
  const isValidInput = useMemo(() => isValidFeeInput(newTxFee), [newTxFee]);

  // Handle fee preset selection
  const handlePresetClick = useCallback((value: number) => {
    setNewTxFee(value.toString());
    setError('');
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (val: string) => {
      setNewTxFee(val);
      if (error) setError('');
    },
    [error]
  );

  // Handle RBF submit
  const handleSubmit = useCallback(async () => {
    if (!isValidInput) {
      setError(t('Please enter a valid fee amount'));
      return;
    }

    setPending(true);
    setError('');

    try {
      await handleReplaceTransaction(e.transaction_id, currentTotalFee);
      setSuccess(true);
      await sleepSecond(3);
      setSuccess(false);
      setShowRBFFeature(false);
    } catch (err) {
      log.debug('RBF error:', err);
      const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
      tools.toastError(errMsg);
      setError(errMsg);
    } finally {
      setPending(false);
    }
  }, [isValidInput, t, handleReplaceTransaction, e.transaction_id, currentTotalFee, tools]);

  // Toggle RBF panel
  const toggleRBF = useCallback(() => {
    if (pending) return;
    setShowRBFFeature((prev) => !prev);
    setError('');
  }, [pending]);

  // Whether to show RBF button (only shown in submitted status)
  const canShowRBF = e.status === 'submitted';

  return (
    <Column full>
      <Card
        key={e.transaction_id}
        classname="card-select"
        mt="sm"
        style={{
          gap: 0,
          opacity: success ? 0.7 : 1,
          transition: 'opacity 0.3s ease'
        }}
      >
        <Column full gap="zero">
          <Row justifyBetween itemsCenter>
            <Row itemsCenter gap="sm">
              <Text
                text={e.mode === 'retrieve' ? '+' : '-'}
                color={e.mode === 'retrieve' ? 'green' : 'red'}
                preset="regular-bold"
              />
              <Text text={`${formatLocaleString(e.amount)} ${kasTick}`} preset="regular-bold" />
            </Row>
            <TxConfirmState pending={pending} status={e.status} mode={e.mode} blockTime={Number(e.block_time)} />
          </Row>

          <Row justifyBetween itemsCenter mt="xs">
            <Text text={shortAddress(e?.transaction_id)} preset="sub" color={success ? 'green' : undefined} />
            <Row itemsCenter gap="sm">
              <Text text={`${t('Fee')}: ${e?.txFee} ${kasTick}`} preset="sub" color={success ? 'green' : undefined} />
              {canShowRBF && (
                <Button
                  preset="default"
                  onClick={toggleRBF}
                  disabled={pending}
                  style={{
                    minHeight: '24px',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                  textStyle={{ fontSize: '11px' }}
                  text={showRBFFeature ? t('Cancel') : t('Speed Up')}
                />
              )}
            </Row>
          </Row>
        </Column>
      </Card>

      {/* RBF panel */}
      {showRBFFeature && canShowRBF && (
        <Card
          preset="style2"
          mt="xs"
          style={{
            backgroundColor: colors.bg5,
            border: `1px solid ${colors.border}`
          }}
        >
          <Column full gap="sm">
            {/* Title row */}
            <Row justifyBetween itemsCenter>
              <Row itemsCenter gap="xs">
                <Icon icon="warning" color="aqua" size={14} />
                <Text text={t('Add Transaction Fee (RBF)')} preset="sub-bold" />
              </Row>
              <Icon icon="close" color="textDim" size={14} onClick={toggleRBF} containerStyle={{ cursor: 'pointer' }} />
            </Row>

            {/* Fee preset buttons */}
            <Row gap="xs">
              {FEE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  preset={newTxFee === preset.value.toString() ? 'primary' : 'default'}
                  text={preset.label}
                  onClick={() => handlePresetClick(preset.value)}
                  disabled={pending}
                  style={{
                    flex: 1,
                    minHeight: '32px',
                    fontSize: '12px'
                  }}
                />
              ))}
            </Row>

            {/* Custom input */}
            <Row gap="xs" itemsCenter>
              <Column fullX>
                <Input
                  disabled={pending}
                  preset="amount"
                  placeholder={t('Enter additional fee')}
                  value={newTxFee}
                  onAmountInputChange={handleInputChange}
                  autoFocus
                />
              </Column>
              <Text text={kasTick} preset="sub" color="textDim" />
            </Row>

            {/* Fee summary info */}
            <Row
              justifyBetween
              style={{
                padding: '8px 12px',
                backgroundColor: colors.bg2,
                borderRadius: '4px'
              }}
            >
              <Text text={t('New Total Fee')} preset="sub" />
              <Text
                text={`${formatLocaleString(currentTotalFee.toFixed(8))} ${kasTick}`}
                preset="regular-bold"
                color="aqua"
              />
            </Row>

            {/* Action buttons */}
            <Row gap="xs">
              <Button preset="default" text={t('Cancel')} onClick={toggleRBF} disabled={pending} full />
              <Button
                preset="primary"
                text={pending ? undefined : t('Confirm')}
                onClick={handleSubmit}
                disabled={!isValidInput || pending}
                full
              >
                {pending && <LoadingSpinner size="small" color={colors.black} />}
              </Button>
            </Row>

            {/* Error message */}
            {error && (
              <Row
                itemsCenter
                gap="xs"
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(237, 51, 75, 0.1)',
                  borderRadius: '4px',
                  border: `1px solid ${colors.red}`
                }}
              >
                <Icon icon="warning" color="red" size={12} />
                <Text text={error} color="red" preset="sub" selectText />
              </Row>
            )}

            {/* Success message */}
            {success && (
              <Row
                itemsCenter
                gap="xs"
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(65, 181, 48, 0.1)',
                  borderRadius: '4px',
                  border: `1px solid ${colors.green}`
                }}
              >
                <Icon icon="circle-check" color="green" size={12} />
                <Text text={t('Transaction fee added successfully!')} color="green" preset="sub" />
              </Row>
            )}
          </Column>
        </Card>
      )}
    </Column>
  );
}

interface TxConfirmStateProps {
  pending: boolean;
  status: string;
  mode: TPendingTxType;
  blockTime: number;
}

function TxConfirmState({ pending, status, mode, blockTime }: TxConfirmStateProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (pending) {
      setElapsedSeconds(0);
      return;
    }

    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - blockTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [blockTime, pending]);

  // Format time display
  const formattedTime = useMemo(() => {
    if (elapsedSeconds < 60) {
      return `${elapsedSeconds}s`;
    }
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }, [elapsedSeconds]);

  if (status === 'submitted') {
    return (
      <Row itemsCenter gap="xs">
        <LoadingSpinner size="small" color={colors.grey} />
        <Text text={mode} preset="sub" />
        <Text text={`(${formattedTime})`} preset="sub" color="textDim" />
      </Row>
    );
  }

  return (
    <Row itemsCenter gap="xs">
      <CheckCircleFilled
        style={{
          fontSize: fontSizes.icon,
          color: colors.green
        }}
      />
      <Text text={mode} preset="sub" />
      <Text text={status} preset="sub" color="green" />
    </Row>
  );
}
