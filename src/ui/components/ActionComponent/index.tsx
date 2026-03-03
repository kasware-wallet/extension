import React, { useContext, useRef, useState, useMemo } from 'react';

import { Loading } from './Loading';
import { Tip } from './Tip';
import type { ToastPresets, ToastProps } from './Toast';
import { Toast } from './Toast';

type ToastFunction = (content: string) => void;
type LoadingFunction = (visible: boolean, content?: string) => void;
interface ContextType {
  toast: ToastFunction;
  toastSuccess: ToastFunction;
  toastError: ToastFunction;
  toastWarning: ToastFunction;
  showLoading: LoadingFunction;
  showTip: ToastFunction;
}

const initContext = {
  toast: (_content: string) => {
    // todo
  },
  toastSuccess: (_content: string) => {
    // todo
  },
  toastError: (_content: string) => {
    // todo
  },
  toastWarning: (_content: string) => {
    // todo
  },
  showLoading: () => {
    // todo
  },
  showTip: (_content: string) => {
    // todo
  }
};

const ActionComponentContext = React.createContext<ContextType>(initContext);

// function ToastContainer() {
//   const [toasts, setToasts] = useState<{ key: string; props: ToastProps }[]>([]);

//   const selfRef = useRef<{ toasts: { key: string; props: ToastProps }[] }>({
//     toasts: []
//   });
//   const self = selfRef.current;

//   const basicToast = useCallback(
//     (content: string, preset?: ToastPresets) => {
//       const key = 'Toast_' + Math.random();
//       self.toasts.push({
//         key,
//         props: {
//           preset: preset || 'info',
//           content,
//           onClose: () => {
//             self.toasts = self.toasts.filter((v) => v.key !== key);
//             setToasts(self.toasts.map((v) => v));
//           }
//         }
//       });
//       setToasts(self.toasts.map((v) => v));
//     },
//     [] // Remove toasts dependency to avoid unnecessary recreations
//   );

//   return (
//     <div>
//       {toasts.map(({ key, props }) => (
//         <Toast key={key} {...props} />
//       ))}
//     </div>
//   );
// }

// function LoadingContainer() {
//   const [loadingInfo, setLoadingInfo] = useState<{ visible: boolean; content?: string }>({
//     visible: false,
//     content: ''
//   });

//   if (loadingInfo.visible) {
//     return <Loading text={loadingInfo.content} />;
//   } else {
//     return <div />;
//   }
// }

// function TipContainer() {
//   const [tipData, setTipData] = useState<{ visible: boolean; content: string }>({
//     visible: false,
//     content: ''
//   });

//   if (tipData.visible) {
//     return (
//       <Tip
//         text={tipData.content}
//         onClose={() => {
//           setTipData({ visible: false, content: '' });
//         }}
//       />
//     );
//   } else {
//     return <div />;
//   }
// }

export function ActionComponentProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ key: string; props: ToastProps }[]>([]);
  const [loadingInfo, setLoadingInfo] = useState<{ visible: boolean; content?: string }>({
    visible: false,
    content: ''
  });
  const [tipData, setTipData] = useState<{ visible: boolean; content: string }>({
    visible: false,
    content: ''
  });

  const selfRef = useRef<{ toasts: { key: string; props: ToastProps }[] }>({
    toasts: []
  });

  // Use stable reference to avoid unnecessary recreations
  const contextValue = useMemo(() => {
    const self = selfRef.current;

    const basicToast = (content: string, preset?: ToastPresets) => {
      const key = 'Toast_' + Math.random();
      self.toasts.push({
        key,
        props: {
          preset: preset || 'info',
          content,
          onClose: () => {
            self.toasts = self.toasts.filter((v) => v.key !== key);
            setToasts([...self.toasts]);
          }
        }
      });
      setToasts([...self.toasts]);
    };

    return {
      toast: (content: string) => basicToast(content),
      toastSuccess: (content: string) => basicToast(content, 'success'),
      toastError: (content: string) => basicToast(content, 'error'),
      toastWarning: (content: string) => basicToast(content, 'warning'),
      showLoading: (visible: boolean, content?: string) => {
        setLoadingInfo({ visible, content });
      },
      showTip: (content: string) => {
        setTipData({ content, visible: true });
      }
    };
  }, []); // Empty dependency array to ensure it's only created once on mount

  return (
    <ActionComponentContext.Provider value={contextValue}>
      {children}
      <div>
        {toasts.map(({ key, props }) => (
          <Toast key={key} {...props} />
        ))}
      </div>
      {loadingInfo.visible && <Loading text={loadingInfo.content} />}
      {tipData.visible && (
        <Tip
          text={tipData.content}
          onClose={() => {
            setTipData({ visible: false, content: '' });
          }}
        />
      )}
    </ActionComponentContext.Provider>
  );
}

export function useTools() {
  const ctx = useContext(ActionComponentContext);
  return ctx;
}
