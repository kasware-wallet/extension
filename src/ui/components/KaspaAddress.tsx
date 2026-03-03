import React, { useState, useEffect, useRef } from 'react';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';

interface KaspaAddressProps {
  address: string;
}

const KaspaAddress: React.FC<KaspaAddressProps> = ({ address }) => {
  const [copied, setCopied] = useState(false);
  const addressRef = useRef<HTMLSpanElement | null>(null);
  const [fixedHeight, setFixedHeight] = useState<number | null>(null); // Set initial state as null

  useEffect(() => {
    if (addressRef.current) {
      // Calculate the height of the address when it's long and set it as fixed height
      setFixedHeight(addressRef.current.clientHeight);
    }
  }, [address]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="relative flex items-center justify-center w-full bg-bgdarker text-primarytext text-base p-4 border border-slightmuted rounded cursor-pointer"
      style={{ height: fixedHeight !== null ? `${fixedHeight + 16}px` : 'auto' }}
      onClick={handleCopy}
    >
      {copied ? (
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-primary">Copied</span>
          <CheckIcon className="h-6 w-6 text-primary ml-2" />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full hover:text-primary group">
          <span ref={addressRef} className="break-words break-all text-center">
            {address}
          </span>
          <div className="ml-2">
            <DocumentDuplicateIcon className="h-6 w-6 stroke-mutedtext group-hover:stroke-primary transition" />
          </div>
        </div>
      )}
    </div>
  );
};

export default KaspaAddress;
