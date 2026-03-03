import { useEffect, useState } from 'react';
import { useExtensionIsInTab } from '../features/browser/tabs';

export default function () {
  const isTab = useExtensionIsInTab();
  const [style, setStyle] = useState<string | undefined>(undefined);
  // return isTab ? '.js-kasware-popup-container' : undefined;
  useEffect(() => {
    if (isTab) {
      setStyle('.js-kasware-popup-container');
    } else {
      setStyle(undefined);
    }
  }, [isTab]);
  return style;
}
