import { useEffect, useState } from 'react';
import log from 'loglevel';

import type { VersionDetail } from '@/shared/types';
import { useSkipVersionCallback, useVersionInfo } from '@/ui/state/settings/hooks';
import { fontSizes } from '@/ui/theme/font';
import { useWallet } from '@/ui/utils';

import { Button } from '../Button';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

const UPDATE_DOC_URL = 'https://docs.kasware.xyz/wallet/knowledge-base/update-your-wallet';

const DEFAULT_VERSION_DETAIL: VersionDetail = {
  version: '',
  changelogs: [],
  title: ''
};

interface UpgradePopoverProps {
  onClose: () => void;
}

export const UpgradePopover = ({ onClose }: UpgradePopoverProps) => {
  const versionInfo = useVersionInfo();
  const skipVersion = useSkipVersionCallback();
  const wallet = useWallet();

  const [versionDetail, setVersionDetail] = useState<VersionDetail>(DEFAULT_VERSION_DETAIL);
  const [isLoading, setIsLoading] = useState(false);

  const isForceUpdate = versionInfo.forceUpdate === true;

  useEffect(() => {
    if (!versionInfo.newVersion) return;

    let isMounted = true;
    setIsLoading(true);

    wallet
      .getVersionDetail(versionInfo.newVersion)
      .then((res) => {
        if (isMounted) {
          setVersionDetail(res);
        }
      })
      .catch((e) => {
        log.debug('Failed to fetch version detail:', e);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [versionInfo.newVersion, wallet]);

  const handleSkip = () => {
    if (versionInfo.newVersion) {
      skipVersion(versionInfo.newVersion);
    }
    onClose();
  };

  const handleUpdate = () => {
    window.open(UPDATE_DOC_URL, '_blank');
  };

  return (
    <Popover onClose={isForceUpdate ? undefined : onClose}>
      <Column justifyCenter itemsCenter>
        <Column mt="lg">
          <Text preset="bold" text={versionDetail.title || 'New Version Available'} textCenter />
        </Column>

        <div style={{ marginTop: 8, minHeight: isLoading ? 40 : 'auto' }}>
          {isLoading ? (
            <Text text="Loading..." preset="sub" textCenter />
          ) : (
            versionDetail.changelogs.map((log, index) => (
              <div key={`${index}-${log.slice(0, 20)}`} style={{ fontSize: fontSizes.sm }}>
                {log}
              </div>
            ))
          )}
        </div>

        <Row full mt="lg">
          <Button text="Skip" full disabled={isForceUpdate} onClick={handleSkip} />

          <Button text="Go to update" full preset="primary" onClick={handleUpdate} />
        </Row>
      </Column>
    </Popover>
  );
};
