import BigNumber from 'bignumber.js';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { useFeeRateOption, useFetchFeeRateOptionCallback, useLowFeeRate } from '@/ui/state/temp-ui/hooks';
import { colors } from '@/ui/theme/colors';

import { Column } from '../Column';
import { Input } from '../Input';
import { Row } from '../Row';
import { Text } from '../Text';
import log from 'loglevel';

export enum PriorityFeeType {
  SMALL,
  // SLOW,

  AVG,

  LARGE,

  CUSTOM
}

export function FeeRateBar({
  txFee,
  baseTxFee,
  defaultIndex,
  onChange
}: {
  txFee: number;
  baseTxFee?: number; // base fee at feeRate=1 (optional)
  defaultIndex?: number;
  onChange: (feeRate: number) => void; // returns feeRate only
}) {
  const [feeOptions, setFeeOptions] = useState<{ title: string; desc?: string; feeRate: number }[]>([]);
  const fetchFeeRateOption = useFetchFeeRateOptionCallback();
  const networkId = useAppSelector(selectNetworkId);
  const kasTick = useAppSelector(selectKasTick);
  const fRO = useFeeRateOption();
  const [timeLeft, setTimeLeft] = useState(10);
  const [errorMsg, setErrorMsg] = useState(''); // error message

  // Use passed baseTxFee, otherwise use txFee directly
  // effectiveBaseTxFee is the base fee at feeRate=1
  const effectiveBaseTxFee = baseTxFee || txFee;
  const isBaseTxFeeValid = effectiveBaseTxFee > 0;

  // Get lowFeeRate for display and validation
  const lowFeeRate = useLowFeeRate();
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft((currentTime) => currentTime - 1);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      fetchFeeRateOption().then(() => {
        setTimeLeft(10);
      });
    }
  }, [timeLeft, networkId]);
  useEffect(() => {
    setFeeOptions([...fRO, { title: 'Custom', feeRate: 0 }]);
  }, [fRO]);
  const [feeOptionIndex, setFeeOptionIndex] = useState(defaultIndex ? defaultIndex : PriorityFeeType.AVG);
  const [feeInputVal, setFeeInputVal] = useState('');

  useEffect(() => {
    setFeeOptionIndex(defaultIndex ? defaultIndex : PriorityFeeType.AVG);
  }, [defaultIndex]);

  // Only call onChange on user interaction (does not depend on txFee)
  useEffect(() => {
    if (feeOptionIndex === PriorityFeeType.CUSTOM) {
      // Custom mode: user inputs the total transaction fee
      // Derive feeRate = totalFee / baseTxFee
      const totalFee = Number(feeInputVal) || 0;

      // If baseTxFee is not valid, we cannot calculate feeRate correctly
      // because txFee is already feeRate * baseTxFee
      if (!isBaseTxFeeValid) {
        setErrorMsg('Waiting for fee calculation...');
        return;
      }

      let feeRate = 1; // Custom mode base feeRate = 1
      if (effectiveBaseTxFee > 0 && totalFee > 0) {
        feeRate = Number(new BigNumber(totalFee).dividedBy(effectiveBaseTxFee));
      }

      if (feeRate < lowFeeRate) {
        // min totalFee = lowFeeRate * effectiveBaseTxFee (effectiveBaseTxFee is at feeRate=1)
        const minTotalFee = Number(new BigNumber(lowFeeRate).multipliedBy(effectiveBaseTxFee).decimalPlaces(8));
        log.debug(
          'FeeRateBar',
          'minTotalFee',
          minTotalFee,
          'lowFeeRate',
          lowFeeRate,
          'effectiveBaseTxFee',
          effectiveBaseTxFee
        );
        setErrorMsg(`Min fee: ${minTotalFee} ${kasTick}`);
        return;
      }

      setErrorMsg('');
      onChange(feeRate);
      log.debug('FeeRateBar', 'CUSTOM', feeRate, 'totalFee', totalFee, 'effectiveBaseTxFee', effectiveBaseTxFee);
    } else if (feeOptions.length > 0) {
      // Preset mode: return feeRate from feeOptions
      const feeRate = feeOptions[feeOptionIndex].feeRate;
      setErrorMsg('');
      log.debug('FeeRateBar', 'feeRate', feeRate, lowFeeRate);
      onChange(Math.max(feeRate, lowFeeRate));
    }
  }, [feeOptionIndex, feeInputVal, feeOptions, baseTxFee, lowFeeRate, onChange, effectiveBaseTxFee]);

  // This effect only triggers re-renders to update the UI display
  // (does not call onChange — actual onChange calls are in the effect above)
  useEffect(() => {}, [feeOptions, txFee]);

  return (
    <Column mt="lg">
      <Text text={`Update in ${timeLeft} s`} preset="xsub" mx="sm" />
      <Row justifyCenter gap="sm">
        {feeOptions.map((v, index) => {
          const selected = index === feeOptionIndex;
          return (
            <div
              key={v.title}
              onClick={() => {
                setFeeOptionIndex(index);
              }}
              style={Object.assign(
                {},
                {
                  borderWidth: 1,
                  borderColor: selected ? colors.aqua : 'rgba(255,255,255,0.3)',
                  height: 45,
                  width: 75,
                  textAlign: 'center',
                  padding: 4,
                  borderRadius: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                } as CSSProperties,
                selected
                  ? {
                      backgroundColor: colors.aqua,
                      boxShadow: '0 2px 8px rgba(72, 227, 197, 0.3)'
                    }
                  : {}
              )}
            >
              {v.title == 'Custom' && (
                <Text text={v.title} textCenter style={{ color: selected ? colors.aqua_dark : colors.white }} />
              )}
              {v.title !== 'Custom' && (
                <Text
                  text={`${v.title}`}
                  size="xxs"
                  textCenter
                  // style={{
                  //   color:
                  //     Number(new BigNumber(effectiveBaseTxFee).multipliedBy(v.feeRate).decimalPlaces(8)) > 5
                  //       ? colors.red
                  //       : selected
                  //       ? colors.aqua_dark
                  //       : colors.white,
                  //   wordBreak: 'break-all'
                  // }}
                  my="sm"
                />
              )}
              {v.title !== 'Custom' && (
                <Text
                  text={`${v.desc}`}
                  size="xxs"
                  textCenter
                  style={{ color: selected ? colors.aqua_dark : colors.white_muted }}
                />
              )}
            </div>
          );
        })}
      </Row>
      {feeOptionIndex === PriorityFeeType.CUSTOM && (
        <Column mt="lg">
          <Input
            preset="amount"
            placeholder={'amount'}
            value={feeInputVal}
            onAmountInputChange={(amount) => {
              setFeeInputVal(amount);
            }}
            autoFocus={true}
          />
          {errorMsg && <Text text={errorMsg} color="danger" size="xxs" mt="sm" mx="sm" />}
        </Column>
      )}
    </Column>
  );
}
