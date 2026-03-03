import { Column, Row, Text } from '@/ui/components';
import NextButton from '@/ui/components/buttons/NextButton';
import type { InputNumberProps, SliderSingleProps } from 'antd';
import { Slider } from 'antd';
import React from 'react';

interface SlippageSettingsProps {
  onClose: () => void;

  onSelectSlippage: (slippage: number) => void;
  slippage: number;
}

const SlippageSettings: React.FC<SlippageSettingsProps> = ({ onClose, onSelectSlippage, slippage }) => {
  const onChangeSlider: InputNumberProps['onChange'] = (newValue) => {
    const num = newValue?.toString();

    onSelectSlippage(Number(num));
  };

  const handleConfirm = () => {
    onSelectSlippage(slippage as number);
    onClose();
  };
  const marks: SliderSingleProps['marks'] = {
    0.5: '0.5%',
    30: '30%'
  };

  return (
    <Column>
      <Text text={'Slippage'} preset="regular" color="textDim" mt="md" />
      <Text text={`${slippage} %`} preset="regular" color="textDim" mt="md" />
      <Row justifyBetween mt="zero" mb="md" selfItemsCenter fullX>
        <Column full>
          <Slider marks={marks} min={0.5} max={30} step={0.1} onChange={onChangeSlider} value={slippage} />
        </Column>
      </Row>

      <NextButton text="Confirm" onClick={handleConfirm} buttonEnabled={true} />
    </Column>
  );
};

export default SlippageSettings;
