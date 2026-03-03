/* eslint-disable no-loop-func */
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import type { IOrder } from '@/shared/types';
import { useWallet } from '@/ui/utils';

import { selectCurrentKaspaAddress } from '../../accounts/reducer';
import { useAppSelector } from '../../hooks';
import { selectNetworkId } from '../../settings/reducer';

// const LOCAL_STORAGE_KEY = 'chainge_orders';

// const getOrdersFromLocalStorage = (): IOrder[] => {
//   const savedOrders = localStorage.getItem(LOCAL_STORAGE_KEY);
//   return savedOrders ? JSON.parse(savedOrders) : [];
// };

// const saveOrdersToLocalStorage = (orders: IOrder[]) => {
//   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
// };

// export function useChaingePollOrdersBackup() {
//   const [orders, setOrders] = useState<IOrder[]>(getOrdersFromLocalStorage());
//   const location = useLocation();
//   const wallet = useWallet();
//   useEffect(() => {
//     saveOrdersToLocalStorage(orders);
//   }, [orders]);

//   const hasKaspaOrder = orders.some((order) => order.payTokenTicker === 'KAS' || order.receiveTokenTicker === 'KAS');
//   const tokenTickersSet = new Set(orders.flatMap((order) => [order.payTokenTicker, order.receiveTokenTicker]));
//   if (tokenTickersSet.has('KAS')) {
//     tokenTickersSet.add('KASPA');
//   }
//   useEffect(() => {
//     const shouldPoll =
//       (location.pathname === '/transactions/kaspa' && hasKaspaOrder) ||
//       location.pathname === '/transactions/krc20' ||
//       Array.from(tokenTickersSet).some((ticker) => location.pathname === `/wallet/crypto-details/${ticker}`);

//     if (!shouldPoll) return;
//     let isMounted = true;

//     const pollAllOrders = async () => {
//       const activeOrders = [...orders];

//       for (const order of activeOrders) {
//         const pollOrderStatus = async () => {
//           while (isMounted) {
//             try {
//               const response = await wallet.fetchOrderStatus(order.orderId);
//               const { status } = response.data;

//               //These are the possible statuses from Chainge
//               //   TxStatusUnknown    = "Unknown"
//               //   TxStatusPending    = "Pending"
//               //   TxStatusVerified   = "Verified"
//               //   TxStatusSucceeded  = "Succeeded"
//               //   TxStatusFailed     = "Failed"
//               //   TxStatusDropped    = "Dropped"
//               //   TxStatusWaitVerify = "WaitVerify"
//               //   TxStatusRefunding  = "Refunding"
//               //   TxStatusRefunded   = "Refunded"

//               // These are the only 4 possible final statuses
//               const finalStatuses = ['Succeeded', 'Refunded', 'Dropped', 'Failed'];
//               if (finalStatuses.includes(status)) {
//                 setOrders((prevOrders) => prevOrders.filter((o) => o.orderId !== order.orderId));
//                 break;
//               } else {
//                 await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before polling again
//               }
//             } catch (err) {
//               console.error(`Error polling order ${order.orderId}:`, err);
//               break;
//             }
//           }
//         };

//         pollOrderStatus();
//       }
//     };

//     pollAllOrders();

//     return () => {
//       isMounted = false;
//     };
//   }, [orders, location.pathname]);

//   const addOrder = useCallback((order: IOrder) => {
//     setOrders((prevOrders) => [...prevOrders, order]);
//   }, []);

//   return {
//     orders,
//     addOrder
//   };
// }

export function useChaingePollOrders() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const location = useLocation();
  const wallet = useWallet();
  const networkId = useAppSelector(selectNetworkId);
  const address = useAppSelector(selectCurrentKaspaAddress);

  const getOrdersFromLocalStorage = async () => {
    const savedOrders = await wallet.getChaingeSwapOrder(networkId, address);
    setOrders(savedOrders || []);
  };

  useEffect(() => {
    getOrdersFromLocalStorage();
  }, []);

  // useEffect(() => {
  //   saveOrdersToLocalStorage(orders);
  // }, [orders]);

  const hasKaspaOrder = orders.some((order) => order.payTokenTicker === 'KAS' || order.receiveTokenTicker === 'KAS');
  const tokenTickersSet = new Set(orders.flatMap((order) => [order.payTokenTicker, order.receiveTokenTicker]));
  if (tokenTickersSet.has('KAS')) {
    tokenTickersSet.add('KASPA');
  }
  useEffect(() => {
    const shouldPoll =
      (location.pathname === '/transactions/kaspa' && hasKaspaOrder) ||
      location.pathname === '/transactions/krc20' ||
      Array.from(tokenTickersSet).some((ticker) => location.pathname === `/wallet/crypto-details/${ticker}`);

    if (!shouldPoll) return;
    let isMounted = true;

    const pollAllOrders = async () => {
      const activeOrders = [...orders];

      for (const order of activeOrders) {
        const pollOrderStatus = async () => {
          while (isMounted) {
            try {
              const finalStatuses = ['Succeeded', 'Refunded', 'Dropped', 'Failed'];
              if (order?.status && finalStatuses.includes(order?.status)) {
                setOrders((prevOrders) => prevOrders.filter((o) => o.orderId !== order.orderId));
                break;
              }
              const response = await wallet.fetchOrderStatus(order.orderId);
              const { status } = response.data;
              // if (!order?.status || (order?.status && order.status !== status)) {
              //   const newOrder = { ...order, status };
              //   await wallet.updateChaingeSwapOrder(networkId, address, newOrder);
              // }

              //These are the possible statuses from Chainge
              //   TxStatusUnknown    = "Unknown"
              //   TxStatusPending    = "Pending"
              //   TxStatusVerified   = "Verified"
              //   TxStatusSucceeded  = "Succeeded"
              //   TxStatusFailed     = "Failed"
              //   TxStatusDropped    = "Dropped"
              //   TxStatusWaitVerify = "WaitVerify"
              //   TxStatusRefunding  = "Refunding"
              //   TxStatusRefunded   = "Refunded"

              // These are the only 4 possible final statuses

              if (finalStatuses.includes(status)) {
                setOrders((prevOrders) => prevOrders.filter((o) => o.orderId !== order.orderId));
                break;
              } else {
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before polling again
              }
            } catch (err) {
              console.error(`Error polling order ${order.orderId}:`, err);
              break;
            }
          }
        };

        pollOrderStatus();
      }
    };

    pollAllOrders();

    return () => {
      isMounted = false;
    };
  }, [orders, location.pathname]);

  const addOrder = useCallback((order: IOrder) => {
    setOrders((prevOrders) => [order, ...prevOrders]);
    // wallet.updateChaingeSwapOrder(networkId, address, order);
  }, []);

  return {
    orders,
    addOrder
  };
}
