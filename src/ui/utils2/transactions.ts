import { chaingeMinterAddresses } from './constants/constants';
import type { KRC20Transaction } from './interfaces';

interface OperationDetails {
  // TODO handle deploy op
  operationType: 'Sent' | 'Received' | 'Minted' | 'Swapped' | 'Unknown';
  isSent: boolean;
  isReceived: boolean;
  isSwappedTo: boolean;
  isSwappedFrom: boolean;
  isMint: boolean;
}

export function getOperationDetails(operation: KRC20Transaction, address: string): OperationDetails {
  const { op, to, from } = operation;
  const isSent = op === 'transfer' && to !== address;
  const isReceived = op === 'transfer' && to === address;
  const isSwappedTo = op === 'transfer' && Object.values(chaingeMinterAddresses).includes(to);
  const isSwappedFrom = op === 'transfer' && Object.values(chaingeMinterAddresses).includes(from);
  const isMint = op === 'mint';
  const operationType =
    isSwappedTo || isSwappedFrom
      ? 'Swapped'
      : isMint
      ? 'Minted'
      : isSent
      ? 'Sent'
      : isReceived
      ? 'Received'
      : 'Unknown';

  return { operationType, isSent, isReceived, isSwappedTo, isSwappedFrom, isMint };
}

export const getTransactionStatusText = (operationType: string, opAccept: string, op: string): string => {
  return opAccept === '1' ? operationType : `${op.charAt(0).toUpperCase() + op.slice(1)} Failed`;
};
