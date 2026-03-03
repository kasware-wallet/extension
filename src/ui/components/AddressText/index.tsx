import { useMemo, useState } from 'react';

import type { ToAddressInfo } from '@/shared/types';
import type { ColorTypes } from '@/ui/theme/colors';
import { shortAddress } from '@/ui/utils';

import { AddressDetailPopover } from '../AddressDetailPopover';
import { Column } from '../Column';
import { CopyableAddress } from '../CopyableAddress';
import { Row } from '../Row';
import { Text } from '../Text';

export const AddressText = (props: {
  address?: string;
  addressInfo?: ToAddressInfo;
  textCenter?: boolean;
  color?: ColorTypes;
}) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const address = useMemo(() => {
    if (props.address) {
      return props.address;
    }
    if (props.addressInfo) {
      return props.addressInfo.address;
    }
    return '';
  }, [props.addressInfo?.address, props.address]);
  const domain = props.addressInfo?.domain;
  const knsDomain = props.addressInfo?.knsDomain;
  return (
    <Column>
      {knsDomain ? (
        <Column
          onClick={() => {
            setPopoverVisible(true);
          }}
        >
          {domain && <Text text={domain} textCenter={props.textCenter} />}
          {knsDomain && (
            <Row full itemsCenter mt="sm">
              <CopyableAddress address={knsDomain.owner || ''} />
              {/* <AccordingInscription knsDomain={knsDomain} /> */}
            </Row>
          )}
        </Column>
      ) : (
        <Column
          onClick={() => {
            setPopoverVisible(true);
          }}
        >
          <Text text={shortAddress(address)} color={props.color || 'white'} />
        </Column>
      )}
      {popoverVisible && (
        <AddressDetailPopover
          address={address}
          onClose={() => {
            setPopoverVisible(false);
          }}
        />
      )}
    </Column>
  );
};
