import type { ReactEventHandler } from 'react';

import type { AddressAssets } from '@/shared/types';
import { fontSizes } from '@/ui/theme/font';

import { Avatar } from 'antd';
import { Card } from '../Card';
import { Column } from '../Column';
import { CopyableAddress } from '../CopyableAddress';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';
import { sompiToAmount } from '@/shared/utils/format';
import kasplexIcon from '@/assets/icons/kasplex.ico';

interface AddressTypeCardProps {
  label: string;
  address: string;
  checked: boolean;
  assets: AddressAssets;
  onClick?: ReactEventHandler<HTMLDivElement>;
}
export function AddressTypeCard(props: AddressTypeCardProps) {
  const { onClick, label, address, checked, assets } = props;
  const hasVault = Boolean(assets.sompi && assets.sompi > 0);
  return (
    <Card px="zero" py="zero" gap="zero" rounded onClick={onClick}>
      <Column full>
        <Row justifyBetween px="md" pt="md">
          <Column justifyCenter>
            <Text text={label} size="xs" disableTranslate />
          </Column>
        </Row>
        <Row justifyBetween px="md" pb="md">
          <CopyableAddress address={address} />
          <Column justifyCenter>{checked && <Icon icon="check" />}</Column>
        </Row>
        {hasVault && (
          <Row justifyBetween bg="bg3" roundedBottom px="md" py="md">
            <Row justifyCenter>
              <Icon icon="kas" size={fontSizes.iconMiddle} />
              <Text text={`${assets.total_kas} KAS`} color="yellow" />
            </Row>
          </Row>
        )}
      </Column>
    </Card>
  );
}

interface AddressTypeCardProp2 {
  label: string;
  items: {
    address: string;
    path: string;
    sompi: number;
    krc20?: boolean;
  }[];
  checked: boolean;
  onClick?: ReactEventHandler<HTMLDivElement>;
}

export function AddressTypeCard2(props: AddressTypeCardProp2) {
  const { onClick, label, items, checked } = props;
  return (
    <Card px="zero" py="zero" gap="zero" rounded onClick={onClick}>
      <Column full>
        <Row justifyBetween px="md" pt="md">
          <Column justifyCenter>
            <Text text={label} size="xs" disableTranslate />
          </Column>
          <Column justifyCenter>{checked && <Icon icon="check" />}</Column>
        </Row>

        {items.map((v) => (
          <Row px="md" pb="sm" key={v.address} itemsCenter>
            <Column>
              <Row>
                <CopyableAddress address={v.address} />
              </Row>

              {/* <Text text={`(${v.path})`} size="xs" color="textDim" disableTranslate /> */}
            </Column>
            {v.sompi > 0 && (
              <Row justifyCenter gap="xxs" itemsCenter selfItemsCenter>
                {v?.krc20 == true && <Avatar size={16} src={kasplexIcon} />}
                <Icon icon="kas" size={fontSizes.icon} />
                <Text text={`${sompiToAmount(v.sompi, 8)} KAS`} color="yellow" size="xxs" />
              </Row>
            )}
            {v.sompi <= 0 && v?.krc20 == true && (
              <Row justifyCenter gap="xxs" itemsCenter selfItemsCenter>
                <Avatar size={16} src={kasplexIcon} />
              </Row>
            )}
          </Row>
        ))}
      </Column>
    </Card>
  );
}
