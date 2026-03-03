import { Avatar } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { TTokenType } from '@/shared/types';
import { Column } from './Column';
import { useKRC20TokenIntro } from '../state/ui/hooks';
import { validateImageLink } from '../utils/imageValidator';

// Import assets
import kaspaIcon from '@/assets/icons/kaspa.svg';
import kasplexIcon from '@/assets/icons/kasplex.ico';
import { useKrc20ProfileImageQuery } from '../hooks/kaspacom';

interface CryptoImageProps {
  ticker: string;
  size: number;
}

const localSvgMap: { [key: string]: string } = {
  KASPA: kaspaIcon,
  KAS: kaspaIcon,
  TKAS: kaspaIcon
};

const CryptoImage: React.FC<CryptoImageProps> = ({ ticker, size }) => {
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const { imageUrl } = useKrc20ProfileImageQuery(ticker);

  useEffect(() => {
    setHasFailed(false);
  }, [ticker]);

  const imgSrc = useMemo(() => {
    if (hasFailed) {
      return kasplexIcon;
    }
    if (ticker in localSvgMap) {
      return localSvgMap[ticker];
    }
    return imageUrl;
  }, [hasFailed, ticker, imageUrl]);

  const handleError = useCallback(() => {
    setHasFailed(true);
    return true;
  }, []);

  return (
    <Column itemsCenter>
      <Avatar size={size} src={imgSrc} onError={handleError} />
    </Column>
  );
};

interface ProfileImageProps {
  ticker: string | undefined;
  size: number;
  tokenType: TTokenType;
  ca?: string;
}
export const ProfileImage: React.FC<ProfileImageProps> = ({ ticker, size, tokenType, ca }) => {
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const [logoUrl, setLogoUrl] = useState<string>(kaspaIcon);

  const krc20TokenIntro = useKRC20TokenIntro();
  const { imageUrl: krc20ImageUrl } = useKrc20ProfileImageQuery(tokenType == 'KAS' ? '' : ticker || '');

  useEffect(() => {
    const handleImage = async () => {
      if (!ticker) return;
      let introIndex = ticker.toLowerCase();
      let imgIndex = ticker.toUpperCase();

      if (tokenType == 'KRC20Issue') {
        introIndex = ca as string;
        imgIndex = ca as string;
      }

      switch (tokenType) {
        case 'KAS': {
          setLogoUrl(kaspaIcon);
          break;
        }

        case 'KRC20Issue': {
          if (introIndex && krc20TokenIntro[introIndex]?.logo != undefined) {
            setLogoUrl(krc20TokenIntro[introIndex].logo as string);
          } else {
            setLogoUrl(kasplexIcon);
          }
          break;
        }

        case 'KRC20Mint': {
          // Define image source priority: kaspacom > kaspa.org > krc20TokenIntro > kasplex

          const potentialSources = [
            krc20ImageUrl,
            // `https://api.kaspa.org/krc20/icons/${imgIndex}.jpg`,
            krc20TokenIntro[introIndex]?.logo,
            kasplexIcon
          ].filter(Boolean);

          // Try to find a valid image source
          for (const source of potentialSources) {
            try {
              const isValid = await validateImageLink(source);
              if (isValid) {
                setLogoUrl(source);
                return;
              }
            } catch (error) {
              // Continue to next source if validation fails
              continue;
            }
          }
          // Fallback to kasplex icon if all sources fail
          setLogoUrl(kasplexIcon);
        }
      }
    };
    handleImage();
  }, [ticker, krc20TokenIntro, tokenType, ca, krc20ImageUrl]);
  useEffect(() => {
    if (hasFailed) {
      if (tokenType === 'KRC20Issue' || tokenType === 'KRC20Mint') {
        setLogoUrl(kasplexIcon);
      } else {
        setLogoUrl(kaspaIcon);
      }
    }
  }, [hasFailed, tokenType]);

  return (
    <Column itemsCenter>
      <Avatar
        size={size}
        src={logoUrl}
        onError={() => {
          setHasFailed(true);
          return true;
        }}
      />
    </Column>
  );
};

export default CryptoImage;
