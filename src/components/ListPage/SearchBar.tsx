import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import type { Dispatch, SetStateAction } from 'react';
import { Tooltip } from 'react-tooltip';

interface SearchBarProps {
  setGlobalFilter: Dispatch<SetStateAction<string>>;
}

export default function SearchBar({ setGlobalFilter }: SearchBarProps) {
  const router = useRouter();

  return (
    <div className='absolute justify-left z-50 flex'>
      <div
        data-tooltip-id='search'
        data-tooltip-content='Search for items in any column of the table'
        className='relative shadow-xl'
      >
        <Tooltip id='search' />

        <span className='absolute inset-y-0 left-4 flex items-center'>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
        <input
          className='block min-w-[20vw] rounded-md border border-black bg-veryLightBlue py-2 text-gray-900 shadow-lg focus:ring-offset-2 focus:ring-4 focus:ring-boldBlue'
          type='text'
          onChange={(e) => {
            setGlobalFilter(e.target.value);
          }}
        />
      </div>
      <button
        className='block min-w-[10vw] ml-5 rounded bg-transparent px-4 py-2 text-white hover:bg-blue hover:shadow-lg'
        type='submit'
        onClick={() => {
          void router.push('/');
        }}
      >
        + New Job
      </button>
    </div>
  );
}
