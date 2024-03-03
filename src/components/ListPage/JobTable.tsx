import React, { useState } from 'react';
import { api } from '~/utils/api';
import StatusChip from './StatusChip';
import { formatDate } from '~/utils/date';
import PowerBIButton from './PowerBIButton';
import TablePaginationBar from './TablePaginationBar';
import Link from 'next/link';

import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnFilter, Row } from '@tanstack/react-table';
import type { Job } from '~/models/domain/job';
import FilterDropdown from './FilterDropdown';
import ColumnSortButton from './ColumnSortButton';

export default function JobTable() {
  const filterDropdownColumns = new Set([
    'Status',
    'Author',
    'Analysis Types'
  ]);
  const sortableColumns = new Set(['Created']);
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const {
    data: analysisTypeOptionsData,
    isLoading: analysisTypeOptionsIsLoading,
  } = api.analysis.getAnalysisTypes.useQuery();
  const analysisTypeOptions: string[] = analysisTypeOptionsIsLoading
    ? []
    : analysisTypeOptionsData?.types?.map(
      (option: { name: string }) => option.name
    ) ?? [];

  const { data, isLoading } = api.job.getJobs.useQuery(undefined, {
    enabled: !queryExecuted,
    onSuccess: () => {
      setQueryExecuted(true);
    },
  });

  const columns = [
    {
      accessorKey: 'jobName',
      header: 'Title',
      size: (1920 / 10) * 1.1,
      cell: (props: { getValue: () => string }) => (
        <Link
          href='/ViewPage'
          passHref
          className='hover:font-bold'
        >
          <p>{props.getValue()}</p>
        </Link>
      ),
    },
    {
      accessorKey: 'jobDescription',
      header: 'Description',
      size: (1920 / 10) * 3.5,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: 'analysisTypes',
      header: 'Analysis Types',
      size: (1920 / 10) * 1.5,
      cell: (props: { getValue: () => string[] }) => (
        <p>{props.getValue().join(', ')}</p>
      ),
      filterFn: (
        row: Row<Job>,
        columnId: string,
        filterAnalysisTypes: string[]
      ) => {
        if (filterAnalysisTypes.length === 0) return true;
        const analysisTypes: string[] = row.getValue(columnId);
        return filterAnalysisTypes.every((analysisType) =>
          analysisTypes.includes(analysisType)
        );
      },
    },
    {
      accessorKey: 'author',
      header: 'Author',
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
      filterFn: (
        row: Row<Job>,
        columnId: string,
        filterAuthorNames: string[]
      ) => {
        if (filterAuthorNames.length === 0) return true;
        const status: string = row.getValue(columnId);
        return filterAuthorNames.includes(status);
      },
    },
    {
      accessorKey: 'date',
      header: 'Created',
      size: (1920 / 10) * 2,
      cell: (props: { getValue: () => Date }) => {
        return <p>{formatDate(props.getValue())}</p>;
      },
      sortType: 'datetime',
    },
    {
      accessorKey: 'jobStatus',
      header: 'Status',
      size: (1920 / 10) * 0.7,
      cell: (props: { getValue: () => string }) => (
        <StatusChip status={props.getValue()} />
      ),
      filterFn: (row: Row<Job>, columnId: string, filterStatuses: string[]) => {
        if (filterStatuses.length === 0) return true;
        const author: string = row.getValue(columnId);
        return filterStatuses.includes(author);
      },
    },
    {
      accessorKey: 'powerBILink',
      header: 'Power BI',
      size: (1920 / 10) * 0.7,
      cell: (props: { getValue: () => string; row: Row<Job> }) => (
        <PowerBIButton
          link={props.getValue()}
          status={props.row.original.jobStatus}
        />
      ),
      enableGlobalFilter: false,
      enableColumnFilter: false,
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      globalFilter: globalFilter,
      columnFilters,
    },
    initialState: {
      sorting: [
        {
          id: 'date',
          desc: true,
        },
      ],
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFacetedUniqueValues: getFacetedUniqueValues(),
    columnResizeMode: 'onChange',
  });

  if (isLoading) {
    // Render a loading indicator or message
    return (
      <div className='fixed z-40 flex h-full w-full items-center justify-center bg-lightIndigo/70'>
        <p className='z-40 pb-80 text-6xl text-black'>Connecting...</p>
      </div>
    );
  }

  return (
    <div className='col-start-2 col-end-9 row-start-2 mb-5 mt-5 flex'>
      <div
        className='relative z-20 col-start-2 col-end-9 row-start-3 row-end-4
                     flex h-[64rem] flex-col
                    overflow-x-auto rounded-md bg-veryLightBlue/70 shadow-xl'
      >
        <table className='table w-full bg-veryLightBlue/70'>
          <thead className='sticky top-0 z-20 bg-veryLightBlue'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className='relative pb-2 pl-4 text-left font-bold text-[#595C64]'
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {String(header.column.columnDef.header)}
                    {/* Filter Dropdowns */}
                    {typeof header.column.columnDef.header === 'string' &&
                      filterDropdownColumns.has(
                        header.column.columnDef.header
                      ) && (
                        <FilterDropdown
                          dropdownItems={Array.from(
                            header.column.columnDef.header === 'Analysis Types'
                              ? analysisTypeOptions
                              : header.column.getFacetedUniqueValues().keys()
                          )}
                          filterId={header.id}
                          setColumnFilters={setColumnFilters}
                        />
                      )}
                    {/* Sorting Button */}
                    {typeof header.column.columnDef.header === 'string' &&
                      sortableColumns.has(header.column.columnDef.header) && (
                        <ColumnSortButton
                          columnSortToggle={header.column.getToggleSortingHandler()}
                        />
                      )}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''
                        }`}
                    />
                  </th>
                ))}
              </tr>
            ))}{' '}
          </thead>
        </table>
        <div className='flex-grow overflow-y-auto'>
          <table className='table w-full'>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`${table.getRowModel().rows.indexOf(row) % 2 === 0
                      ? 'bg-white'
                      : 'bg-lightIndigo'
                    } h-[4.28rem]`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className='pl-4 text-base font-[400] text-[#595C64]'
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='mt-auto'>
          <TablePaginationBar table={table} />
        </div>
      </div>
    </div>
  );
}
