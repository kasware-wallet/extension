import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const SearchWalletButton: React.FC = () => {
  const navigate = useNavigate()

  const handleSearchWalletClick = () => {
    navigate('/wallet/search')
  }

  return (
    <button onClick={handleSearchWalletClick} className="flex items-center">
      <MagnifyingGlassIcon className="h-6 w-6 transform transition-transform duration-300 hover:scale-125 text-mutedtext" />
    </button>
  )
}

export default SearchWalletButton
