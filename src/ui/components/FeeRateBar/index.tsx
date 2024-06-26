/* eslint-disable no-unused-vars */
import { CSSProperties, useEffect, useState } from 'react';

import { colors } from '@/ui/theme/colors';
import { useWallet } from '@/ui/utils';

import { Column } from '../Column';
import { Input } from '../Input';
import { Row } from '../Row';
import { Text } from '../Text';

enum FeeRateType {
  NONE,
  // SLOW,
  AVG,
  FAST,
  CUSTOM
}

export function FeeRateBar({ feeRate, onChange }: { feeRate: number | null; onChange: (val: number) => void }) {
  const wallet = useWallet();
  const [feeOptions, setFeeOptions] = useState<{ title: string; desc?: string; feeRate: number }[]>([]);

  useEffect(() => {
    wallet.getFeeSummary().then((v) => {
      setFeeOptions([...v.list, { title: 'Custom', feeRate: 0 }]);
    });
  }, []);

  const [feeOptionIndex, setFeeOptionIndex] = useState(FeeRateType.NONE);
  const [feeRateInputVal, setFeeRateInputVal] = useState('');

  useEffect(() => {
    switch (feeRate) {
      case null:
        if (feeOptionIndex !== FeeRateType.NONE) setFeeOptionIndex(FeeRateType.NONE);
        break;
      case 0:
        if (feeOptionIndex !== FeeRateType.NONE) setFeeOptionIndex(FeeRateType.NONE);
        break;
      case 10:
        if (feeOptionIndex !== FeeRateType.AVG) setFeeOptionIndex(FeeRateType.AVG);
        break;
      case 20:
        if (feeOptionIndex !== FeeRateType.FAST) setFeeOptionIndex(FeeRateType.FAST);
        break;
      default:
        if (feeOptionIndex !== FeeRateType.CUSTOM) setFeeOptionIndex(FeeRateType.CUSTOM);
        setFeeRateInputVal(feeRate.toString());
    }
  }, []);

  useEffect(() => {
    const defaultOption = feeOptions[1];
    const defaultVal = defaultOption ? defaultOption.feeRate : 1;

    let val = defaultVal;
    if (feeOptionIndex === FeeRateType.CUSTOM) {
      val = parseInt(feeRateInputVal) || 0;
    } else if (feeOptions.length > 0) {
      val = feeOptions[feeOptionIndex].feeRate;
    }
    onChange(val);
  }, [feeOptions, feeOptionIndex, feeRateInputVal]);

  const adjustFeeRateInput = (inputVal: string) => {
    let val = parseInt(inputVal);
    if (!val) {
      setFeeRateInputVal('');
      return;
    }
    const defaultOption = feeOptions[0];
    const defaultVal = defaultOption ? defaultOption.feeRate : 1;
    if (val <= 0) {
      val = defaultVal;
    }
    setFeeRateInputVal(val.toString());
  };

  return (
    <Column mt='lg'>
      <Row justifyCenter>
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
                  borderColor: 'rgba(255,255,255,0.3)',
                  height: 75,
                  width: 75,
                  textAlign: 'center',
                  padding: 4,
                  borderRadius: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer'
                } as CSSProperties,
                selected ? { backgroundColor: colors.primary } : {}
              )}>
              <Text text={v.title} textCenter style={{ color: selected ? colors.black : colors.white }} />
              {v.title !== 'Custom' && (
                <Text
                  text={`${v.feeRate}`}
                  size="xxs"
                  textCenter
                  style={{ color: selected ? colors.black : colors.white }}
                />
              )}
              {v.title !== 'Custom' && (
                <Text
                  text={`${v.desc}`}
                  size="xxs"
                  textCenter
                  style={{ color: selected ? colors.black : colors.white_muted }}
                />
              )}
            </div>
          );
        })}
      </Row>
      {feeOptionIndex === FeeRateType.CUSTOM && (
        <Column mt='lg'>
          <Input
            preset="amount"
            placeholder={'multiple of network fee'}
            value={feeRateInputVal}
            onAmountInputChange={(amount) => {
              adjustFeeRateInput(amount);
            }}
            // onBlur={() => {
            //   const val = parseInt(feeRateInputVal) + '';
            //   setFeeRateInputVal(val);
            // }}
            autoFocus={true}
          />
        </Column>
      )}
    </Column>
  );
}
