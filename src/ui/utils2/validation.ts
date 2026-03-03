import type React from 'react';
import ErrorMessages from './constants/errorMessages';

export const validateRecipient = async (
  // request: Function,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  recipientAddress: string,
  yourAddress: string,
  isKaspa: boolean | undefined,
  setRecipientError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  if (!isKaspa && recipientAddress === yourAddress) {
    setRecipientError(ErrorMessages.KRC20.INVALID_RECIPIENT);
    return;
  }
  try {
    const isValid = await request('wallet:validate', [recipientAddress]);
    setRecipientError(isValid ? null : ErrorMessages.KASPA.INVALID_RECIPIENT_ADDRESS);
  } catch (err) {
    console.error(ErrorMessages.KASPA.ADDRESS_VALIDATION_ERROR(err));
    setRecipientError(ErrorMessages.KASPA.ADDRESS_VALIDATION_ERROR(err));
  }
};

export const validateAmountToSend = (
  tokenTick: string,
  value: string,
  formattedBalance: number,
  setAmountError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const numericValue = parseFloat(value);

  // TODO don't set error here if value is 0. Let components handle 0
  if (tokenTick === 'KASPA') {
    if (value.length === 0 || isNaN(numericValue) || numericValue <= 0) {
      setAmountError(ErrorMessages.SEND_AMOUNT.MORE_THAN_ZERO);
    } else if (numericValue < 0.2) {
      setAmountError(ErrorMessages.SEND_AMOUNT.MINIMUM_KASPA);
    } else if (numericValue > formattedBalance) {
      setAmountError(ErrorMessages.SEND_AMOUNT.EXCEEDS_BALANCE(formattedBalance));
    } else {
      setAmountError(null);
    }
  } else {
    if (isNaN(numericValue) || numericValue <= 0 || numericValue > formattedBalance) {
      setAmountError(ErrorMessages.SEND_AMOUNT.GENERAL(formattedBalance));
    } else {
      setAmountError(null);
    }
  }
};
