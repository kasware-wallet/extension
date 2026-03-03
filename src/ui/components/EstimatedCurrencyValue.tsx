import React from 'react';

interface EstimatedCurrencyValueProps {
  formattedCurrencyValue: string;
}

const EstimatedCurrencyValue: React.FC<EstimatedCurrencyValueProps> = ({ formattedCurrencyValue }) => {
  return <span className="text-mutedtext text-base">{`${formattedCurrencyValue ? formattedCurrencyValue : '0'}`}</span>;
};

export default EstimatedCurrencyValue;
