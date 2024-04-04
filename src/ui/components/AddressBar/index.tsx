/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAccountAddress } from '@/ui/state/accounts/hooks';
import { copyToClipboard, shortAddress } from '@/ui/utils';

import { CopyOutlined } from '@ant-design/icons';
import { useTools } from '../ActionComponent';
import { Row } from '../Row';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';

export function AddressBar() {
  const { t } = useTranslation();
  const tools = useTools();
  const address = useAccountAddress();
  return (
    <Row
      selfItemsCenter
      itemsCenter
      onClick={(e) => {
        copyToClipboard(address).then(() => {
          tools.toastSuccess(t('Copied'));
        });
      }}>
      <Text text={shortAddress(address,9)} color="textDim" />
      {/*<Icon icon="copy" color="textDim" />*/}
      <CopyOutlined style={{color:'#888',fontSize:14}}/>
    </Row>
  );
}
