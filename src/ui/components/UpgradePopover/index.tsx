import { useEffect, useState } from 'react';

import type { VersionDetail } from '@/shared/types';
import { useVersionInfo } from '@/ui/state/settings/hooks';
import { fontSizes } from '@/ui/theme/font';
import { useWallet } from '@/ui/utils';

import log from 'loglevel';
import { Button } from '../Button';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

export const UpgradePopover = ({ onClose }: { onClose: () => void }) => {
  const versionInfo = useVersionInfo();

  const [versionDetail, setVersionDetail] = useState<VersionDetail>({ version: '', changelogs: [], title: '' });
  const wallet = useWallet();
  useEffect(() => {
    if (!versionInfo.newVersion) return;
    wallet
      .getVersionDetail(versionInfo.newVersion)
      .then((res) => {
        setVersionDetail(res);
      })
      .catch((e) => {
        log.debug(e);
      });
  }, [versionInfo.newVersion]);
  return (
    <Popover onClose={versionInfo.forceUpdate == true ? undefined : onClose}>
      <Column justifyCenter itemsCenter>
        <Column mt="lg">
          <Text preset="bold" text={versionDetail.title} textCenter />
        </Column>

        <div style={{ marginTop: 8 }}>
          {versionDetail.changelogs.map((str, index) => (
            <div key={index} style={{ fontSize: fontSizes.sm }}>
              {str}
            </div>
          ))}
        </div>

        <Row full mt="lg">
          <Button
            text="Skip"
            full
            disabled={versionInfo.forceUpdate == true}
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
          />

          <Button
            text="Go to update"
            full
            preset="primary"
            onClick={(e) => {
              window.open('https://docs.kasware.xyz/wallet/knowledge-base/update-your-wallet');
            }}
          />
        </Row>
      </Column>
    </Popover>
  );
};
