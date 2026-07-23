import { useEffect, useMemo, useState } from 'react';

import type { ContactBookItem } from '@/shared/types/contact-book';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useAccountAddress, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useKeyrings } from '@/ui/state/keyrings/hooks';
import { useWallet } from '@/ui/utils';
import { Card } from '../Card';
import { Column, Row, Text } from '../index';
import { shortAddress, copyToClipboard, formatTimeAgo } from '@/ui/utils';
import { Empty } from '../Empty';

interface RecentTabProps {
  handleAddrInput: (address: string) => void;
  evm?: boolean;
  chainId?: string;
}

export function RecentTab({ handleAddrInput, evm, chainId }: RecentTabProps) {
  const wallet = useWallet();
  const networkId = useAppSelector(selectNetworkId);
  const currentKaspaAddress = useAccountAddress();
  const currentAccount = useCurrentAccount();
  const keyrings = useKeyrings();
  const [transactionInfos, setTransactionInfos] = useState<{ address: string; time: number }[]>([]);
  const [contacts, setContacts] = useState<ContactBookItem[]>([]);

  const currentAddress = evm ? currentAccount?.evmAddress || '' : currentKaspaAddress;
  const currentAddressKey = evm ? currentAddress.toLowerCase() : currentAddress;

  useEffect(() => {
    const fetchRecentSendToAddress = async () => {
      if (evm) {
        if (!chainId) {
          setTransactionInfos([]);
          return;
        }
        const data = await wallet.walletEVM.getRecentSendToAddressEVM(chainId, currentAddress);
        setTransactionInfos(data);
      } else {
        const data = await wallet.getRecentSendToAddressKaspa(networkId, currentAddress);
        setTransactionInfos(data);
      }
    };
    fetchRecentSendToAddress();
  }, [evm, chainId, networkId, currentAddress, wallet]);

  useEffect(() => {
    const fetchContacts = async () => {
      const list = await wallet.listContact();
      setContacts(list);
    };
    fetchContacts();
  }, [wallet]);

  // Build address-to-name lookup map: contacts first, then wallet accounts
  // For EVM, normalize keys to lowercase for consistent lookups
  const addressNameMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Wallet accounts take lower priority (contacts override)
    for (const keyring of keyrings) {
      for (const account of keyring.accounts) {
        const addr = evm ? account.evmAddress : account.address;
        if (addr) {
          const key = evm ? addr.toLowerCase() : addr;
          const displayName =
            currentAddressKey === key
              ? `${keyring.alianName} - ${account.alianName} (Self)`
              : `${keyring.alianName} - ${account.alianName}`;
          map[key] = displayName;
        }
      }
    }

    // Contacts take higher priority (override wallet account names)
    for (const contact of contacts) {
      if (contact.address && contact.name) {
        const key = evm ? contact.address.toLowerCase() : contact.address;
        map[key] = contact.name;
      }
    }

    return map;
  }, [contacts, keyrings, currentAddressKey, evm]);

  if (transactionInfos && transactionInfos.length > 0) {
    return (
      <div>
        {transactionInfos
          .filter((e) => e.address?.length > 0 && e?.time > 0)
          .map((e) => {
            const lookupKey = evm ? e.address.toLowerCase() : e.address;
            const displayName = addressNameMap[lookupKey];
            return (
              <Card
                mt="md"
                key={e.address + e.time}
                classname="card-select"
                onClick={async () => {
                  handleAddrInput(e.address);
                  copyToClipboard(e.address);
                }}
              >
                <Row full>
                  <Column>
                    {displayName && <Text text={displayName} />}
                    <Text text={shortAddress(e.address, 8)} preset={displayName ? 'sub' : undefined} />
                    <Text text={`Sent ${formatTimeAgo(e.time)}`} size="xs" preset="sub" />
                  </Column>
                </Row>
              </Card>
            );
          })}
      </div>
    );
  } else {
    return <Empty />;
  }
}
