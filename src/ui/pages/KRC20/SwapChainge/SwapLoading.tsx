import { Row } from '@/ui/components';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { LoadingOutlined } from '@ant-design/icons';

export default function SwapLoading() {
  return (
    <Row full justifyCenter mt='xxl'>
      <LoadingOutlined
        style={{
          fontSize: fontSizes.icon,
          color: colors.orange
        }}
      />
    </Row>
  );
}
