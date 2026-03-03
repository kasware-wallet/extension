/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getUiType } from '.';
import { useWallet } from './WalletContext';
import { PATH_BOOST_SCREEN } from '@/shared/constant/route-path';

export const useApproval = () => {
  const wallet = useWallet();
  const navigate = useNavigate();
  const getApproval = wallet.getApproval;
  const removeNotifiWindow = wallet.removeNotifiWindow;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveApproval = async (data?: any, stay = false, forceReject = false) => {
    const approval = await getApproval();

    if (approval) {
      wallet.resolveApproval(data, forceReject);
    }
    if (stay) {
      return;
    }
    setTimeout(() => {
      navigate(PATH_BOOST_SCREEN);
    });
  };

  const rejectApproval = async (err?, stay = false, isInternal = false) => {
    const approval = await getApproval();
    if (approval) {
      await wallet.rejectApproval(err, stay, isInternal);
    }
    if (!stay) {
      navigate(PATH_BOOST_SCREEN);
    }
  };

  useEffect(() => {
    if (!getUiType().isNotification) {
      return;
    }
    window.addEventListener('beforeunload', rejectApproval);

    return () => window.removeEventListener('beforeunload', rejectApproval);
  }, []);

  return [getApproval, resolveApproval, rejectApproval, removeNotifiWindow] as const;
};

export const useWalletRequest = (
  requestFn,
  {
    onSuccess,
    onError
  }: {
    onSuccess?(arg: any): void;
    onError?(arg: any): void;
  }
) => {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);
  const [loading, setLoading] = useState<boolean>(false);
  const [res, setRes] = useState<any>();
  const [err, setErr] = useState<any>();

  const run = async (...args) => {
    setLoading(true);
    try {
      const _res = await Promise.resolve(requestFn(...args));
      if (!mounted.current) {
        return;
      }
      setRes(_res);
      if (onSuccess) {
        onSuccess(_res);
      }
    } catch (err) {
      if (!mounted.current) {
        return;
      }
      setErr(err);
      if (onError) {
        onError(err);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  return [run, loading, res, err] as const;
};
export interface UseHoverOptions {
  mouseEnterDelayMS?: number;
  mouseLeaveDelayMS?: number;
}

export type HoverProps = Pick<React.HTMLAttributes<HTMLElement>, 'onMouseEnter' | 'onMouseLeave'>;

export const useHover = ({ mouseEnterDelayMS = 0, mouseLeaveDelayMS = 0 }: UseHoverOptions = {}): [
  boolean,
  HoverProps,
  () => void
] => {
  const [isHovering, setIsHovering] = useState(false);
  const mouseEnterTimer = useRef<number | undefined>(undefined);
  const mouseOutTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(mouseEnterTimer.current);
      clearTimeout(mouseOutTimer.current);
    };
  }, []);

  return [
    isHovering,
    {
      onMouseEnter: () => {
        clearTimeout(mouseOutTimer.current);
        mouseEnterTimer.current = window.setTimeout(() => setIsHovering(true), mouseEnterDelayMS);
      },
      onMouseLeave: () => {
        clearTimeout(mouseEnterTimer.current);
        mouseOutTimer.current = window.setTimeout(() => setIsHovering(false), mouseLeaveDelayMS);
      }
    },
    () => setIsHovering(false)
  ];
};
