import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Column, Content, Header, Input, Layout } from '@/ui/components';

export interface EditNameScreenProps {
  /** Header title */
  title: string;
  /** Input placeholder */
  placeholder: string;
  /** Button text (will be translated) */
  buttonText: string;
  onBack: () => Promise<void> | void;
  /** Callback when form is submitted */
  onSubmit: (name: string) => Promise<void> | void;
  /** Optional extra actions rendered below the submit button */
  extraActions?: React.ReactNode;
}

/**
 * Unified screen for editing names (accounts, contacts, wallets).
 * Previously split into EditAccountNameScreen, EditContactNameScreen, EditWalletNameScreen.
 */
export default function EditNameScreen({
  title,
  placeholder,
  buttonText,
  onBack,
  onSubmit,
  extraActions
}: EditNameScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    await onSubmit(name);
    onBack();
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const isValidName = useMemo(() => {
    return name.length > 0;
  }, [name]);

  return (
    <Layout>
      <Header onBack={onBack} title={title} />
      <Content>
        <Column gap="lg">
          <Input
            placeholder={placeholder}
            onChange={(e) => {
              setName(e.target.value);
            }}
            onKeyUp={handleOnKeyUp}
            autoFocus={true}
          />
          <Button disabled={!isValidName} text={t(buttonText)} preset="primary" onClick={handleSubmit} />
          {extraActions}
        </Column>
      </Content>
    </Layout>
  );
}
