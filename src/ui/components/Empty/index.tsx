import { useTranslation } from 'react-i18next';
import { Text } from '../Text';

interface EmptyProps {
  text?: string;
}
export function Empty(props: EmptyProps) {
  const { text } = props;
  const { t } = useTranslation();
  const content = text || t('NO DATA');
  return (
    <div
      style={{
        alignSelf: 'center',
        marginTop: '20px'
      }}>
      <Text text={content} preset="sub" textCenter selectText/>
    </div>
  );
}
