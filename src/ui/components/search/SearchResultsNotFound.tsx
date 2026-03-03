import type { KaspaToken, Token } from '@/ui/utils2/interfaces';
import React from 'react';

interface SearchResultsNotFoundProps {
  searchTerm: string;
  filteredTokens: (Token | KaspaToken)[];
}

const SearchResultsNotFound: React.FC<SearchResultsNotFoundProps> = ({ searchTerm, filteredTokens }) => {
  return (
    filteredTokens.length === 0 && (
      <p className="text-mutedtext text-base text-center">
        You don't have any {searchTerm.toUpperCase()} in your wallet. Transfer KRC20 tokens to your wallet using your
        receive address and they will appear here.
      </p>
    )
  );
};

export default SearchResultsNotFound;
