import type { ColorTypes } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { useTools } from '@/ui/components/ActionComponent';
import { Column, Icon, Row, Text } from '@/ui/components';
import { copyToClipboard } from '@/ui/utils';

interface SectionProps {
  value: string | number;
  title: string;
  link?: string;
  valueColor?: ColorTypes;
}

export function Section({ value, title, link, valueColor }: SectionProps) {
  const tools = useTools();
  return (
    <Column>
      <Text text={title} preset="sub" />
      <Row itemsCenter gap="xs">
        <Text
          text={value}
          preset={link ? 'link' : 'regular'}
          size="xs"
          color={valueColor || undefined}
          wrap
          onClick={() => {
            if (link) {
              window.open(link);
            } else {
              copyToClipboard(value).then(() => {
                tools.toastSuccess('Copied');
              });
            }
          }}
        />
        {link !== undefined && <Icon icon="link" size={fontSizes.xxs} color="blue" />}
      </Row>
    </Column>
  );
}
