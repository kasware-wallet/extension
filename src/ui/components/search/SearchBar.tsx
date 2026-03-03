import { Column } from '@/ui/components/Column';
import { Input } from '@/ui/components/Input';
import { Row } from '@/ui/components/Row';
import { SearchOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  placeholder?: string;

  onSearch: (searchTerm: string) => void;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder, onSearch, autoFocus = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <Row fullX justifyBetween itemsCenter selfItemsCenter style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
      <Row style={{ marginLeft: 10 }}>
        <SearchOutlined />
      </Row>
      <Column full>
        <Input
          containerStyle={{ paddingLeft: 0 }}
          preset="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={placeholder || `${t('Search')}...`}
          autoFocus={autoFocus}
        />
      </Column>
    </Row>
  );
};

export default SearchBar;
