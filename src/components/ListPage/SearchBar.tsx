import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import { useSearchBar } from '~/pages/ListPage';

export default function SearchBar() {
  const router = useRouter();
  const { onSearchBarChanged } = useSearchBar();

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
          id='list-search-bar-input'
          className='block min-w-[20vw] rounded-md border border-black bg-veryLightBlue py-2 pl-10 text-gray-900 shadow-lg focus:ring-offset-2 focus:ring-4 focus:ring-boldBlue'
          type='text'
          onChange={(event) => onSearchBarChanged(event.target.value)}
        />
      </div>
      <button
        id='new-job-button'
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
