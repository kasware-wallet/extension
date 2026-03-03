import { validateAmountToSend, validateRecipient } from '@/ui/utils2/validation';
import { useState } from 'react';
import { formatAndValidateAmount } from '..';

export const useTransactionInputs = (token: any, maxAmount: string, yourAddress: string) => {
  const [outputs, setOutputs] = useState<[string, string][]>([['', '']]);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleRecipientChange = (recipientAddress: string, request: any) => {
    setOutputs((prevOutputs) => {
      const newOutputs = [...prevOutputs];
      newOutputs[0][0] = recipientAddress;
      return newOutputs;
    });

    validateRecipient(request, recipientAddress, yourAddress, token.isKaspa, setRecipientError);
  };

  const handleAmountChange = (value: string) => {
    formatAndValidateAmount(value, token.dec);
    setOutputs((prevOutputs) => {
      const newOutputs = [...prevOutputs];
      newOutputs[0][1] = value;
      return newOutputs;
    });

    validateAmountToSend(token.tick, value, parseFloat(maxAmount), setAmountError);
  };

  const handleMaxClick = () => {
    setOutputs((prevOutputs) => {
      const newOutputs = [...prevOutputs];
      newOutputs[0][1] = maxAmount.toString();
      return newOutputs;
    });
    setAmountError(null);
  };

  return {
    outputs,
    recipientError,
    amountError,
    handleRecipientChange,
    handleAmountChange,
    handleMaxClick
  };
};
