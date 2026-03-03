import { useTranslation } from 'react-i18next';

import { toChecksumHexAddress } from '@/shared/modules/hexstring-utils';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { copyToClipboard, shortAddress } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';

import { useTools } from '../ActionComponent';
import { Row } from '../Row';
import { Text } from '../Text';

export function AddressBar({ length = 6, showEvmAddress = true }) {
  const { t } = useTranslation();
  const tools = useTools();
  const address = useAppSelector(selectCurrentKaspaAddress);
  const account = useCurrentAccount();
  return (
    <>
      <Row
        selfItemsCenter
        itemsCenter
        onClick={() => {
          copyToClipboard(address).then(() => {
            tools.toastSuccess(t('Copied'));
          });
        }}>
        <Text text={shortAddress(address, length)} color="textDim" style={{ wordWrap: 'break-word' }} />
        <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
      </Row>
      {showEvmAddress == true && <DisplayAddress address={toChecksumHexAddress(account.evmAddress)} length={length} />}
    </>
  );
}

export function DisplayAddress({ address, length }) {
  const { t } = useTranslation();
  const tools = useTools();

  return (
    <Row
      selfItemsCenter
      itemsCenter
      onClick={() => {
        copyToClipboard(address).then(() => {
          tools.toastSuccess(t('Copied'));
        });
      }}>
      <Text text={shortAddress(address, length)} color="textDim" style={{ wordWrap: 'break-word' }} />
      <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
    </Row>
  );
}
