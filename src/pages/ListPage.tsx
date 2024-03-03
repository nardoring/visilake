import JobTable from '~/components/ListPage/JobTable';
import Layout from '../components/Layout';
import { ToastContainer } from 'react-toastify';
import { createContext, useCallback, useContext, useState } from 'react';

export const SearchBarContext = createContext<{
  searchBarText: string;
  onSearchBarChanged: (text: string) => void;
}>({
  searchBarText: '',
  onSearchBarChanged: () => {},
});

export default function ListPage() {
  const [searchBarText, setSearchBarText] = useState<string>('');

  const onSearchBarChanged = useCallback((text: string) => {
    setSearchBarText(text);
  }, []);

  return (
    <main className='min-h-screen'>
      <SearchBarContext.Provider value={{ searchBarText, onSearchBarChanged }}>
        <Layout>
          <JobTable />
        </Layout>
        <ToastContainer
          position='bottom-right'
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='light'
        />
      </SearchBarContext.Provider>
    </main>
  );
}

export const useSearchBar = () => {
  const context = useContext(SearchBarContext);
  if (!context) {
    throw new Error(
      'useSearchBar must be used within a SearchBarContext.Provider'
    );
  }
  return context;
};
