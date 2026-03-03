import { copyToClipboard, shortAddress } from '@/ui/utils';
import { useTranslation } from 'react-i18next';
import { useTools } from '../ActionComponent';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';

export function CopyableAddress({ address }: { address: string }) {
  const { t } = useTranslation();
  const tools = useTools();
  return (
    <Row
      itemsCenter
      gap="sm"
      onClick={() => {
        copyToClipboard(address).then(() => {
          tools.toastSuccess(t('Copied'));
        });
      }}>
      <Icon icon="copy" color="textDim" />
      <Text text={shortAddress(address)} color="textDim" />
    </Row>
  );
}
