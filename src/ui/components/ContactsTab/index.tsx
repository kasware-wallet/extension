import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ContactBookItem } from '@/shared/types/contact-book';
import { useWallet } from '@/ui/utils';
import { isValidKaspaAddress } from '@/ui/utils';
import { Empty } from '../Empty';
import { AddressTypeCardSimple } from '../AddressTypeCardSimple';
import { isValidAddress } from '@ethereumjs/util';

interface ContactsTabProps {
  handleAddrInput: (address: string) => void;
  evm: boolean;
}

export function ContactsTab({ handleAddrInput, evm }: ContactsTabProps) {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [items, setItems] = useState<ContactBookItem[]>([]);

  useEffect(() => {
    const getContacts = async () => {
      let contacts = await wallet.listContact();
      if (evm) {
        contacts = contacts.filter((e) => isValidAddress(e.address));
      } else {
        contacts = contacts.filter((e) => isValidKaspaAddress(e.address));
      }
      setItems(contacts);
    };
    getContacts();
  }, [evm, wallet]);

  if (items.length == 0) {
    return <Empty text={t('No contacts')} />;
  } else {
    return (
      <div>
        {items.map((account) => {
          return (
            <AddressTypeCardSimple
              key={account.address}
              name={account.name}
              address={account.address}
              handleAddrInput={handleAddrInput}
            />
          );
        })}
      </div>
    );
  }
}
