import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';

import walletLogo from '@/assets/logo/wallet-logo.png';

import { LoadingSpinner } from '../LoadingSpinner';
import { Image } from '../Image';
import { Row } from '../Row';
import { Text } from '../Text';

export function Logo(props: { preset?: 'large' | 'small'; connected?: boolean }) {
  const { preset, connected } = props;
  if (preset === 'large') {
    return (
      <Row justifyCenter itemsCenter>
        <Image src={walletLogo} size={fontSizes.xxxl} />

        <Text text="KASWARE" preset="title-bold" size="xxl" disableTranslate />
      </Row>
    );
  } else if (connected == false) {
    return (
      <Row justifyCenter itemsCenter>
        {/* <Image src="@/assets/logo/wallet-logo-grey.png" size={fontSizes.xxl} /> */}
        <LoadingSpinner size="small" color={colors.orange} text="Connecting..." />
      </Row>
    );
  } else {
    return (
      <Row justifyCenter itemsCenter>
        <Image src={walletLogo} size={36} />
        {/* <Text text="KASWARE" preset="title-bold" disableTranslate /> */}
      </Row>
    );
  }
}
