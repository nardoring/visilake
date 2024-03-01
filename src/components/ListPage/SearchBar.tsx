import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import type { Dispatch, SetStateAction } from 'react';
import { Tooltip } from 'react-tooltip';
import { useSearchBar } from '~/pages/ListPage';

interface SearchBarProps {
  setGlobalFilter: Dispatch<SetStateAction<string>>;
}

export default function SearchBar({ setGlobalFilter }: SearchBarProps) {
  const router = useRouter();
  const { searchBarText, onSearchBarChanged } = useSearchBar();

  return (
    <div className='absolute justify-left z-50 flex'>
      <div
        data-tooltip-id='search'
        data-tooltip-content='Search for items in any column of the table'
        className='relative shadow-xl'>

        <Tooltip id='search' />

        <span className='absolute inset-y-0 left-4 flex items-center'>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
        <input
          id="filter-text-box"
          className="block min-w-[20vw] rounded-md border border-black bg-veryLightBlue py-2 text-gray-900 shadow-lg focus:ring-offset-2 focus:ring-4 focus:ring-boldBlue"
          type="text"
          onChange={(event) => onSearchBarChanged(event.target.value)}
        />
      </div>
      <button
        className="block min-w-[10vw] ml-5 rounded bg-transparent px-4 py-2 text-white hover:bg-blue hover:shadow-lg"
        type="submit"
        onClick={() => {
          void router.push('/');
        }}
      >
        + New Job
      </button>
    </div>
  );
}
