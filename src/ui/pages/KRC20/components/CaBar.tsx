import { useTranslation } from 'react-i18next';

import { useTools } from '@/ui/components/ActionComponent';
import { Row, Text } from '@/ui/components';
import { copyToClipboard, shortAddress } from '@/ui/utils';
import { colors } from '@/ui/theme/colors';
import { CopyOutlined } from '@ant-design/icons';

interface CaBarProps {
  length?: number;
  ca: string;
}

export function CaBar({ length = 12, ca }: CaBarProps) {
  const { t } = useTranslation();
  const tools = useTools();

  return (
    <Row
      selfItemsCenter
      itemsCenter
      onClick={() => {
        copyToClipboard(ca).then(() => {
          tools.toastSuccess(t('Copied'));
        });
      }}
    >
      <Text text={shortAddress(ca, length)} color="textDim" style={{ wordWrap: 'break-word' }} />
      <CopyOutlined style={{ color: colors.icon_secondary, fontSize: 14 }} />
    </Row>
  );
}
