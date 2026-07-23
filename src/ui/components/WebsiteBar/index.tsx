import { Card } from '../Card';
import { Column } from '../Column';
import { Text } from '../Text';

const WebsiteBar = ({ session }: { session: { origin: string; icon: string; name: string } }) => {
  return (
    <Card preset="style2" selfItemsCenter fullX gap="lg">
      <Column fullX>
        <Text text={session.name} />
        <Text text={session.origin} preset="sub" />
      </Column>
    </Card>
  );
};

export default WebsiteBar;
