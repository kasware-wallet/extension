import { useDisplayName } from '@/ui/hooks/useDisplayName';
import { Card } from '../Card';
import { Column, Text } from '../index';
import { shortAddress, copyToClipboard } from '@/ui/utils';

interface AddressTypeCardSimpleProps {
  address: string;
  name?: string;
  handleAddrInput: (addr: string) => void;
}

export function AddressTypeCardSimple({ address, name, handleAddrInput }: AddressTypeCardSimpleProps) {
  const displayName = useDisplayName(name);
  return (
    <Card
      classname="card-select"
      justifyBetween
      mt="md"
      onClick={async () => {
        handleAddrInput(address);
        copyToClipboard(address).then(() => {
          // tools.toastSuccess('Copied');
        });
      }}
    >
      <Column>
        <Text text={displayName} />
        <Text text={shortAddress(address, 8)} preset="sub" />
      </Column>
    </Card>
  );
}
