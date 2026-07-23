import { copyToClipboard } from '@/shared/utils/clipboard';
import { useTranslation } from 'react-i18next';
import { useTools } from '../ActionComponent';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';
import { shortAddress } from '@/ui/utils';

export function CopyableAddress({ address }: { address: string }) {
  const { t } = useTranslation();
  const tools = useTools();
  return (
    <Row
      itemsCenter
      gap="sm"
      onClick={async () => {
        try {
          await copyToClipboard(address);
          tools.toastSuccess(t('Copied'));
        } catch {
          tools.toastError(t('Copy failed'));
        }
      }}
    >
      <Icon icon="copy" color="textDim" />
      <Text text={shortAddress(address)} color="textDim" />
    </Row>
  );
}
