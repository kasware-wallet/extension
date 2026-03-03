import BigNumber from 'bignumber.js';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useFeeRateOption, useFetchFeeRateOptionCallback } from '@/ui/state/ui/hooks';
import { colors } from '@/ui/theme/colors';

import { Column } from '../Column';
import { Input } from '../Input';
import { Row } from '../Row';
import { Text } from '../Text';

// enum FeeRateType {
//   NONE,
//   // SLOW,
//   AVG,
//   FAST,
//   CUSTOM
// }

export enum PriorityFeeType {
  SMALL,
  // SLOW,

  AVG,

  LARGE,

  CUSTOM
}

// export function FeeRateBarLegacy({ feeRate, onChange }: { feeRate: number | null; onChange: (val: number) => void }) {
//   const wallet = useWallet();
//   const [feeOptions, setFeeOptions] = useState<{ title: string; desc?: string; feeRate: number }[]>([]);

//   useEffect(() => {
//     wallet.getFeeSummary().then((v) => {
//       setFeeOptions([...v.list, { title: 'Custom', feeRate: 0 }]);
//     });
//   }, []);

//   const [feeOptionIndex, setFeeOptionIndex] = useState(FeeRateType.NONE);
//   const [feeRateInputVal, setFeeRateInputVal] = useState('');

//   useEffect(() => {
//     switch (feeRate) {
//       case null:
//         if (feeOptionIndex !== FeeRateType.NONE) setFeeOptionIndex(FeeRateType.NONE);
//         break;
//       case 0:
//         if (feeOptionIndex !== FeeRateType.NONE) setFeeOptionIndex(FeeRateType.NONE);
//         break;
//       case 10:
//         if (feeOptionIndex !== FeeRateType.AVG) setFeeOptionIndex(FeeRateType.AVG);
//         break;
//       case 20:
//         if (feeOptionIndex !== FeeRateType.FAST) setFeeOptionIndex(FeeRateType.FAST);
//         break;
//       default:
//         if (feeOptionIndex !== FeeRateType.CUSTOM) setFeeOptionIndex(FeeRateType.CUSTOM);
//         setFeeRateInputVal(feeRate?.toString());
//     }
//   }, []);

//   useEffect(() => {
//     const defaultOption = feeOptions[1];
//     const defaultVal = defaultOption ? defaultOption.feeRate : 1;

//     let val = defaultVal;
//     if (feeOptionIndex === FeeRateType.CUSTOM) {
//       val = parseInt(feeRateInputVal) || 0;
//     } else if (feeOptions.length > 0) {
//       val = feeOptions[feeOptionIndex].feeRate;
//     }
//     onChange(val);
//   }, [feeOptions, feeOptionIndex, feeRateInputVal]);

//   const adjustFeeRateInput = (inputVal: string) => {
//     let val = parseInt(inputVal);
//     if (!val) {
//       setFeeRateInputVal('');
//       return;
//     }
//     const defaultOption = feeOptions[0];
//     const defaultVal = defaultOption ? defaultOption.feeRate : 1;
//     if (val <= 0) {
//       val = defaultVal;
//     }
//     setFeeRateInputVal(val.toString());
//   };

//   return (
//     <Column mt="lg">
//       <Row justifyCenter>
//         {feeOptions.map((v, index) => {
//           const selected = index === feeOptionIndex;
//           return (
//             <div
//               key={v.title}
//               onClick={() => {
//                 setFeeOptionIndex(index);
//               }}
//               style={Object.assign(
//                 {},
//                 {
//                   borderWidth: 1,
//                   borderColor: 'rgba(255,255,255,0.3)',
//                   height: 45,
//                   width: 75,
//                   textAlign: 'center',
//                   padding: 4,
//                   borderRadius: 5,
//                   display: 'flex',
//                   flexDirection: 'column',
//                   justifyContent: 'center',
//                   cursor: 'pointer'
//                 } as CSSProperties,
//                 selected ? { backgroundColor: colors.aqua } : {}
//               )}>
//               <Text text={v.title} textCenter style={{ color: selected ? colors.black : colors.white }} />
//               {v.title !== 'Custom' && (
//                 <Text
//                   text={`${v.feeRate}`}
//                   size="xxs"
//                   textCenter
//                   style={{ color: selected ? colors.black : colors.white }}
//                 />
//               )}
//               {/* {v.title !== 'Custom' && (
//                 <Text
//                   text={`${v.desc}`}
//                   size="xxs"
//                   textCenter
//                   style={{ color: selected ? colors.black : colors.white_muted }}
//                 />
//               )} */}
//             </div>
//           );
//         })}
//       </Row>
//       {feeOptionIndex === FeeRateType.CUSTOM && (
//         <Column mt="lg">
//           <Input
//             preset="amount"
//             placeholder={'multiple of network fee'}
//             value={feeRateInputVal}
//             onAmountInputChange={(amount) => {
//               adjustFeeRateInput(amount);
//             }}
//             // onBlur={() => {
//             //   const val = parseInt(feeRateInputVal) + '';
//             //   setFeeRateInputVal(val);
//             // }}
//             autoFocus={true}
//           />
//         </Column>
//       )}
//     </Column>
//   );
// }

export function FeeRateBar({
  txFee,
  defaultIndex,
  onChange
}: {
  txFee: number;
  defaultIndex?: number;

  onChange: (val: number) => void;
}) {
  const [feeOptions, setFeeOptions] = useState<{ title: string; desc?: string; feeRate: number }[]>([]);
  const fetchFeeRateOption = useFetchFeeRateOptionCallback();
  const networkId = useAppSelector(selectNetworkId);
  const fRO = useFeeRateOption();
  const [timeLeft, setTimeLeft] = useState(10);
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

  useEffect(() => {
    const defaultOption = feeOptions[defaultIndex ? defaultIndex : PriorityFeeType.AVG];
    const defaultVal = defaultOption ? defaultOption.feeRate : 1;

    let fee = defaultVal;
    if (feeOptionIndex === PriorityFeeType.CUSTOM) {
      fee = Number(feeInputVal) || 0;
    } else if (feeOptions.length > 0) {
      fee = Number(new BigNumber(feeOptions[feeOptionIndex].feeRate).multipliedBy(txFee).decimalPlaces(8));
    }
    onChange(fee);
  }, [feeOptions, feeOptionIndex, feeInputVal, txFee, defaultIndex]);

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
                  borderColor: 'rgba(255,255,255,0.3)',
                  height: 45,
                  width: 75,
                  textAlign: 'center',
                  padding: 4,
                  borderRadius: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer'
                } as CSSProperties,
                selected ? { backgroundColor: 'rgba(255, 255, 255, 0.2)' } : {}
              )}
            >
              {v.title == 'Custom' && (
                <Text text={v.title} textCenter style={{ color: selected ? colors.aqua_dark : colors.white }} />
              )}
              {v.title !== 'Custom' && (
                <Text
                  text={`${Number(new BigNumber(txFee).multipliedBy(v.feeRate).decimalPlaces(8))}`}
                  size="xxs"
                  textCenter
                  style={{
                    color:
                      Number(new BigNumber(txFee).multipliedBy(v.feeRate).decimalPlaces(8)) > 5
                        ? colors.red
                        : selected
                        ? colors.aqua_dark
                        : colors.white,
                    wordBreak: 'break-all'
                  }}
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
            // onBlur={() => {
            //   const val = parseInt(feeRateInputVal) + '';
            //   setFeeInputVal(val);
            // }}
            autoFocus={true}
          />
        </Column>
      )}
    </Column>
  );
}
