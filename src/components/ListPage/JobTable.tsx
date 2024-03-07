import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '~/utils/api';
import { AgGridReact } from 'ag-grid-react';
import type { SortDirection } from 'ag-grid-community';
import type { ITooltipParams } from 'ag-grid-enterprise';
import { useSearchBar } from '~/pages/ListPage';
import PowerBIButton from './PowerBIButton';
import StatusChip from './StatusChip';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import useWindowDimensions from '~/utils/useWindowResolution';
import Link from 'next/link';

const ROW_HEIGHT = 70;
const PAGINATION_PAGE_SIZES = [5, 10, 15, 20];

export default function JobTable() {
  const { searchBarText } = useSearchBar();
  const { windowHeight, windowWidth } = useWindowDimensions();
  const gridRef = useRef<AgGridReact>(null);
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);

  const { data, isLoading } = api.job.getJobs.useQuery(undefined, {
    enabled: !queryExecuted,
    onSuccess: () => {
      setQueryExecuted(true);
    },
  });

  const [messageQueryExecuted, setMessageQueryExecuted] =
    useState<boolean>(true);

  api.jobUpdates.getJobUpdates.useQuery(undefined, {
    enabled: !messageQueryExecuted,
    onSuccess: (result) => {
      if (result && result?.length != 0) {
        setQueryExecuted(false);
      }

      setMessageQueryExecuted(true);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageQueryExecuted(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const [colDefs] = useState([
    {
      field: 'jobName',
      filter: 'agTextColumnFilter',
      cellRenderer: (params: { value: string }) => (
        <Link
          href='/ViewPage'
          passHref
          className='hover:font-bold'
        >
          <p>{params.value}</p>
        </Link>
      ),
    },
    {
      field: 'jobDescription',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'analysisTypes',
      filter: 'agMultiColumnFilter',
      valueGetter: (params: { data: { analysisTypes: string[] } }) =>
        params.data.analysisTypes.join(', '),
      filterValueGetter: (params: { data: { analysisTypes: string[] } }) =>
        params.data.analysisTypes,
    },
    {
      field: 'date',
      filter: 'agDateColumnFilter',
      sort: 'desc' as SortDirection,
      // Ignore global filter ()
      getQuickFilterText: () => {
        return '';
      },
    },
    { field: 'author', filter: 'agMultiColumnFilter' },
    {
      field: 'jobStatus',
      headerName: 'Status',
      maxWidth: 170,
      minWidth: 170,
      cellRenderer: StatusChip,
      filter: 'agSetColumnFilter',
      filterParams: {
        cellRenderer: StatusChip,
        suppressSelectAll: true,
      },
      tooltipValueGetter: (params: ITooltipParams) => {
        const tooltipMessages: Record<string, string> = {
          COMPLETE: 'Processing job has been completed',
          PROCESSING: 'Data is currently being processed',
          QUEUED: 'Processing job will soon be started',
          FAILED: 'An error has occurred',
        };

        return tooltipMessages[params.value as string] ?? 'INVALID';
      },
    },
    {
      field: 'powerBILink',
      headerName: 'PowerBI',
      cellRenderer: PowerBIButton,
      maxWidth: 100,
      minWidth: 100,
      resizable: false,
      sortable: false,
      headerTooltip: 'Provides a data source link to use within PowerBI',
      tooltipValueGetter: (params: ITooltipParams) => {
        if ((params.data as { jobStatus: string }).jobStatus !== 'COMPLETE')
          return 'Link is unavailable';
        return 'Copy link to clipboard';
      },
      // Ignore global filter ()
      getQuickFilterText: () => {
        return '';
      },
    },
  ]);

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      floatingFilter: true,
      filterParams: {
        buttons: ['clear'],
      },
      wrapText: true,
    }),
    []
  );

  function getPaginationPageSizeDefault() {
    if (windowHeight != null) {
      const pageSize = Math.floor((windowHeight - 500) / ROW_HEIGHT);
      return PAGINATION_PAGE_SIZES.reduce((prev, curr) => {
        return curr <= pageSize ? curr : prev;
      });
    }
    return PAGINATION_PAGE_SIZES[0];
  }

  const gridOptions = {
    rowHeight: ROW_HEIGHT,

    pagination: true,
    paginationPageSize: getPaginationPageSizeDefault(),
    paginationPageSizeSelector: PAGINATION_PAGE_SIZES,

    tooltipShowDelay: 250,

    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressValues: true,
            suppressPivots: true,
            suppressPivotMode: true,
            suppressRowGroups: true,
          },
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
        },
      ],
    },
  };

  useEffect(() => {
    gridRef.current?.api?.setGridOption('quickFilterText', searchBarText);
  }, [searchBarText]);

  if (isLoading) {
    // Render a loading indicator or message
    return (
      <div className='fixed z-40 flex h-full w-full items-center justify-center bg-lightIndigo/70'>
        <p className='z-40 pb-80 text-6xl text-black'>Connecting...</p>
      </div>
    );
  }

  return (
    <div className='col-start-2 col-end-9 row-start-2 mb-5 mt-5'>
      <div
        className='relative z-20 col-start-2 col-end-9 row-start-3 row-end-4
                     flex h-[128rem] flex-col
                    overflow-x-auto rounded-md'
      >
        <div className={'ag-theme-quartz'}>
          <AgGridReact
            ref={gridRef}
            rowData={data}
            columnDefs={colDefs}
            gridOptions={gridOptions}
            domLayout={'autoHeight'}
            defaultColDef={defaultColDef}
          />
        </div>
      </div>
    </div>
  );
}
