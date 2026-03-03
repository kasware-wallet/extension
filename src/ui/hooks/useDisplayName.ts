import { useMemo } from 'react';

import { useExtensionIsInTab } from '@/ui/features/browser/tabs';

export function useDisplayName(name?: string | undefined): string | undefined {
  const isTab = useExtensionIsInTab();

  return useMemo(() => {
    if (!name) {
      return name;
    }
    if (isTab || name.length <= 20) {
      return name;
    }
    return name.substring(0, 20) + '...';
  }, [name, isTab]);
}
