import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useKeyrings } from '@/ui/state/keyrings/hooks';
import { AddressTypeCardSimple } from '../AddressTypeCardSimple';
import { Text } from '@/ui/components';

interface MyAccountTabProps {
  handleAddrInput: (address: string) => void;
  evm: boolean;
}

export function MyAccountTab({ handleAddrInput, evm }: MyAccountTabProps) {
  const currentAccount = useCurrentAccount();
  const keyrings = useKeyrings();

  return (
    <div>
      {keyrings.map((keyring) => {
        return (
          <div key={keyring.key}>
            <Text text={keyring.alianName} mt="md" />
            {keyring.accounts.map((account) => {
              return (
                <AddressTypeCardSimple
                  key={account.pubkey}
                  name={currentAccount.address == account.address ? account.alianName + ' (Self)' : account.alianName}
                  address={evm ? account.evmAddress : account.address}
                  handleAddrInput={handleAddrInput}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
