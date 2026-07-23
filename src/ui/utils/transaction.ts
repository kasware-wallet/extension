import type { ITransactionInfo } from '@/shared/types';
import { sompiToAmount } from '@/shared/utils/format';

/**
 * Process raw transaction data into displayable transaction info.
 */
export function handleTransactions(data, address): ITransactionInfo[] {
  const transactionInfos: ITransactionInfo[] = [];
  for (let i = 0; i < data.length; i++) {
    let mode = '';
    const isAccepted = data[i].is_accepted as boolean;
    let amount = '0';
    let usdValue = '0';
    const block_time = data[i].block_time;
    const transaction_id = data[i].transaction_id;
    const item = data[i];
    let inputAmountSelf = 0;
    let inputAmountOther = 0;
    let outputAmountSelf = 0;
    let outputAmountOther = 0;
    const relatedAddresses: string[] = [];
    item.inputs?.map((e) => {
      if (e.previous_outpoint_address == address) {
        inputAmountSelf = e.previous_outpoint_amount + inputAmountSelf;
      } else {
        inputAmountOther = e.previous_outpoint_amount + inputAmountOther;
      }
    });
    item.outputs?.map((e) => {
      if (e.script_public_key_address == address) {
        outputAmountSelf = e.amount + outputAmountSelf;
      } else {
        outputAmountOther = e.amount + outputAmountOther;
      }
    });
    if (inputAmountSelf == 0) {
      mode = 'Receive';
      amount = sompiToAmount(outputAmountSelf, 8).replace(/\.0+$/, '');
      usdValue = amount;
      item.inputs.map((e) => {
        if (e.previous_outpoint_address != address) {
          relatedAddresses.push(e.previous_outpoint_address);
        }
      });
    } else if (inputAmountSelf - outputAmountSelf >= 0) {
      mode = 'Send';
      amount = sompiToAmount(inputAmountSelf - outputAmountSelf, 8).replace(/\.0+$/, '');
      usdValue = amount;
      item.outputs.map((e) => {
        if (e.script_public_key_address != address) {
          relatedAddresses.push(e.script_public_key_address);
        }
      });
    } else if (inputAmountSelf - outputAmountSelf < 0) {
      mode = 'Receive';
      amount = sompiToAmount(outputAmountSelf - inputAmountSelf, 8).replace(/\.0+$/, '');
      usdValue = amount;
      item.inputs.map((e) => {
        if (e.previous_outpoint_address != address) {
          relatedAddresses.push(e.previous_outpoint_address);
        }
      });
    }

    transactionInfos.push({
      mode,
      isAccepted,
      amount,
      usdValue,
      block_time,
      transaction_id,
      relatedAddresses,
      txDetail: data[i],
      payload: item?.payload
    });
  }

  return transactionInfos;
}
