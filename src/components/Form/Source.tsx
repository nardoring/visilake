import React, { useState } from 'react';
import { api } from '~/utils/api';
import type { Source } from '~/utils/types';

interface SourceProps {
  source: Source;
  updateSource: (source: Source, isValid: boolean) => void;
  onRemove: (source: Source) => void;
}

const Source = ({ source, updateSource, onRemove }: SourceProps) => {
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);
  const { data: sourceValidationData, isLoading } =
    api.source.validateSource.useQuery(
      { source: source.name },
      {
        enabled: !queryExecuted,
        onSuccess: (data) => {
          updateSource(source, data.isValid);
          setQueryExecuted(true);
        },
      }
    );

  const loading = isLoading && !sourceValidationData;

  return (
    <div
      className={`m-1 flex items-center justify-center rounded-full border ${
        loading
          ? 'border-gray-300 bg-gray-100 text-gray-700'
          : sourceValidationData?.isValid
            ? 'border-green-300 bg-green-100 text-green-700'
            : 'border-red-300 bg-red-100 text-red-700'
      } px-2 py-1 font-medium`}
    >
      <div className='max-w-full flex-initial text-xs font-normal leading-none'>
        {source.name}
      </div>
      <div
        className='flex flex-auto flex-row-reverse'
        onClick={() => onRemove(source)}
      >
        <div>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='100%'
            height='100%'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='feather feather-x ml-2 h-4 w-4 cursor-pointer rounded-full hover:text-indigo-400'
          >
            <line
              x1='18'
              y1='6'
              x2='6'
              y2='18'
            ></line>
            <line
              x1='6'
              y1='6'
              x2='18'
              y2='18'
            ></line>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Source;
