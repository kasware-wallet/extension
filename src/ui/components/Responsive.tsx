import { useThemeModeOnMain } from '@/evm/ui/hooks/usePreference';
import { useExtensionIsInTab } from '../features/browser/tabs';

export const AppDimensions = (props) => {
  const extensionIsInTab = useExtensionIsInTab();
  useThemeModeOnMain();

  return (
    <div
      style={{
        width: extensionIsInTab ? '100vw' : '357px',
        height: extensionIsInTab ? '100vh' : '600px'
      }}
      {...props}
    />
  );
};
