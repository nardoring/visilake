import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '~/utils/api';
import { AgGridReact } from 'ag-grid-react';
import type { GetRowIdParams, SortDirection } from 'ag-grid-community';
import type { ITooltipParams } from 'ag-grid-enterprise';
import { useSearchBar } from '~/pages/ListPage';
import PowerBIButton from './PowerBIButton';
import StatusChip from './StatusChip';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import useWindowDimensions from '~/utils/useWindowResolution';
import Link from 'next/link';
import { JobUpdateMessage } from '~/models/sqs/jobUpdateMessage';
import { Job } from '~/models/domain/job';
import { statusOrder, JobStatus } from '~/models/domain/jobStatus';
import { JobUpdateTopicMessage } from '~/models/sqs/jobUpdateTopicMessage';
import getGranularityLabel from '~/utils/granularity';
import { formatDate } from '~/utils/date';

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

  const [selectedQueueExecutted, setSelectedQueueExecutted] =
    useState<boolean>(false);

  const { data: selectedQueue, isLoading: selectedQueueIsLoading } =
    api.jobUpdates.getRandomQueueUrl.useQuery(undefined, {
      enabled: !selectedQueueExecutted,
      onSuccess: () => {
        setSelectedQueueExecutted(true);
      },
    });

  const [messageQueryExecuted, setMessageQueryExecuted] =
    useState<boolean>(true);

  const parseJobUpdateMessage = (
    sqsBody: string | undefined
  ): JobUpdateMessage | undefined => {
    if (!sqsBody) {
      return;
    }

    const messageParse = JSON.parse(sqsBody) as JobUpdateTopicMessage;

    if (!messageParse?.Message) {
      return;
    }

    return JSON.parse(messageParse.Message) as unknown as JobUpdateMessage;
  };

  const mapJobUpdateMessageToUseCase = (jobUpdate: JobUpdateMessage): Job => {
    return {
      jobName: jobUpdate.name,
      jobDescription: jobUpdate.description,
      jobId: jobUpdate.request_id,
      jobStatus: jobUpdate.status,
      analysisTypes: jobUpdate.analysis_types,
      author: jobUpdate.author,
      date: new Date(jobUpdate.timestamp * 1000),
      sources: jobUpdate.sources,
      granularity: 1,
      dateRangeEnd: new Date(),
      dateRangeStart: new Date(),
    } as Job;
  };

  api.jobUpdates.getJobUpdates.useQuery(
    { queueUrl: selectedQueue! },
    {
      enabled: !messageQueryExecuted && !selectedQueueIsLoading,
      onSuccess: (result) => {
        if (result && result?.length != 0) {
          const updates = result
            .filter((message) => message.Body)
            .map((message) => parseJobUpdateMessage(message.Body))
            .filter((update) => update) as JobUpdateMessage[];

          updates.forEach((update) => {
            console.log(update);
            if (update.status == 'PENDING') {
              const newJob = mapJobUpdateMessageToUseCase(update);
              console.log(newJob);
              gridRef.current?.api.applyTransaction({ add: [newJob] });
            } else {
              const updatedRow = gridRef.current?.api.getRowNode(
                update.request_id
              );

              if (!updatedRow) {
                return;
              }

              updatedRow?.setDataValue('jobStatus', update.status);
            }
          });
        }

        setMessageQueryExecuted(true);
      },
    }
  );

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
      field: 'sources',
      filter: 'agMultiColumnFilter',
      valueGetter: (params: { data: { sources: string[] } }) =>
        params.data.sources.join(', '),
      filterValueGetter: (params: { data: { sources: string[] } }) =>
        params.data.sources,
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
      field: 'granularity',
      filter: 'agSetColumnFilter',
      hide: true,
      valueGetter: (params: { data: { granularity: number } }) =>
        getGranularityLabel(params.data.granularity),
    },
    {
      headerName: 'Date Range',
      hide: true,
      maxWidth: 170,
      minWidth: 170,
      cellRenderer: (params: {
        data: {
          dateRangeEnd: Date;
          dateRangeStart: Date;
        };
      }) => (
        <p>
          {formatDate(params.data.dateRangeStart)} -{' '}
          {formatDate(params.data.dateRangeEnd)}
        </p>
      ),
      // Ignore global filter ()
      getQuickFilterText: () => {
        return '';
      },
    },
    {
      field: 'date',
      headerName: 'Date Created',
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
      comparator: (valueA: unknown, valueB: unknown) => {
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          const orderA = statusOrder[valueA as JobStatus] || 0;
          const orderB = statusOrder[valueB as JobStatus] || 0;
          return orderA - orderB;
        }
        return 0;
      },
      tooltipValueGetter: (params: ITooltipParams) => {
        const tooltipMessages: Record<string, string> = {
          PENDING: 'Processing job will soon be queued',
          QUEUED: 'Processing job will soon be started',
          PROCESSING: 'Data is currently being processed',
          COMPLETE: 'Processing job has been completed',
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
    getRowId: (params: GetRowIdParams<Job>) => params.data.jobId,

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
