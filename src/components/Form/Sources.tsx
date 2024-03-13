import React, { useEffect, useState } from 'react';
import Source from './Source';
import type { Source as Source_t } from '~/utils/types';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { api } from '~/utils/api';

import { Tooltip } from 'react-tooltip';
import TextField from '@mui/material/TextField';

const AUTOCOMPLETE_OPTIONS_LIMIT = 5;

interface SourcesProps {
  getSources: () => Source_t[];
  setSources: React.Dispatch<React.SetStateAction<Source_t[]>>;
  inputStyles: string;
}

const Sources = ({ getSources, setSources, inputStyles }: SourcesProps) => {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [sourceSubmission, setSourceSubmission] = useState<string>('');

  const autocompleteOptions = createFilterOptions({
    limit: AUTOCOMPLETE_OPTIONS_LIMIT,
  });

  const handleSourceSubmission = () => {
    if (
      sourceSubmission.trim() !== '' &&
      !getSources().some((source) => source.name === sourceSubmission)
    ) {
      setSources([...getSources(), { name: sourceSubmission, isValid: false }]);
    }
    setCurrentInput('');
    setSourceSubmission('');
  };

  const handleRemoveSource = (source: Source_t) => {
    setSources(getSources().filter((val, _) => val.name !== source.name));
  };

  const updateSource = (source: Source_t, isValid: boolean) => {
    const updatedSources = getSources().map((t) =>
      t.name === source.name ? { ...t, isValid: isValid } : t
    );
    setSources(updatedSources);
  };

  useEffect(() => {
    handleSourceSubmission();
  }, [sourceSubmission]);

  const { data: sourceData, isLoading: sourceDataLoading } =
    api.source.getSources.useQuery();

  const sources: string[] = sourceDataLoading ? [] : sourceData ?? [];

  return (
    <>
      <label
        data-tooltip-id='sources'
        data-tooltip-html='Select sources from Data Lake <br> Valid format is 1234-AB(C)-12345'
        htmlFor='sources'
      >
        Sources
      </label>
      <Tooltip id='sources' />
      <Autocomplete
        id='source-autocomplete'
        className={inputStyles}
        freeSolo
        autoComplete
        filterOptions={autocompleteOptions}
        inputValue={currentInput}
        options={sources.sort()}
        // Handle source submission when user hits enter
        onKeyDown={(e) => {
          if (e.key == 'Enter') {
            e.preventDefault();
            setSourceSubmission((e.target as HTMLInputElement).value);
          }
        }}
        onInputChange={(e, v) => setCurrentInput(v)}
        // Submit source when selecting an autocomplete option
        onChange={(e, value, reason) => {
          if (reason === 'selectOption') {
            setSourceSubmission(value as string);
          }
        }}
        // Submit source when clicking outside the input box
        onBlur={(e) =>
          setSourceSubmission((e.target as HTMLInputElement).value)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            className='bg-white rounded-md'
            type='text'
            id='sources'
            placeholder='1234-AB(C)-12345'
          />
        )}
      />
      <div className='flex flex-wrap gap-0'>
        {getSources().map((source) => (
          <Source
            key={`file-source-${source.name}`}
            source={source}
            onRemove={handleRemoveSource}
            updateSource={updateSource}
          />
        ))}
      </div>
    </>
  );
};

export default Sources;
