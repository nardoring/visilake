import React, { useState } from 'react';
import Source from './Source';
import type { Source as Source_t } from '~/utils/types';
import { isKeyboardEvent } from '~/utils/keyboardEvent';
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
  const [currentSource, setCurrentSource] = useState<string>('');

  const autocompleteOptions = createFilterOptions({
    limit: AUTOCOMPLETE_OPTIONS_LIMIT
  });

  const checkSourceEntry = () => {
    if (
      currentSource.trim() !== '' &&
      !getSources().some((source) => source.name === currentSource)
    ) {
      setSources([...getSources(), { name: currentSource, isValid: false }]);
      setCurrentSource('');
    }
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

  const handleSourceEntry = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
      | React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (isKeyboardEvent(e) && e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      checkSourceEntry();
    } else if (e.type === 'blur') {
      checkSourceEntry();
    }
  };

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
        freeSolo
        autoComplete
        filterOptions={autocompleteOptions}
        value={currentSource}
        options={sources.sort()}
        onKeyDown={(e) =>
          {
            if (e.key == "Enter") {
              setCurrentSource((e.target as HTMLInputElement).value)
              handleSourceEntry(e as React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>);
            }
          }
        }
        onChange={(e, value, reason) => {
          if (reason == "selectOption") {
            setCurrentSource(value as string)
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            className={inputStyles}
            type='text'
            id='sources'
            placeholder='1234-AB(C)-12345'
            onBlur={handleSourceEntry}
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
