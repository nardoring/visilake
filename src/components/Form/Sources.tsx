import React, { useState } from 'react';
import Source from './Source';
import type { Source as Source_t } from '~/utils/types';
import { isKeyboardEvent } from '~/utils/keyboardEvent';
import Autocomplete from '@mui/material/Autocomplete';
import { api } from '~/utils/api';

import { Tooltip } from 'react-tooltip';
import TextField from '@mui/material/TextField';

interface SourcesProps {
  getSources: () => Source_t[];
  setSources: React.Dispatch<React.SetStateAction<Source_t[]>>;
  inputStyles: string;
}

const Sources = ({ getSources, setSources, inputStyles }: SourcesProps) => {
  const [currentSource, setCurrentSource] = useState<string>('');

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

  const sources = sourceDataLoading ? [] : sourceData ?? [];

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
        limitTags={5}
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
        renderInput={(params) => (
          <TextField
            {...params}
            className={inputStyles}
            type='text'
            id='sources'
            placeholder='1234-AB(C)-12345'

            // Update source state value
            onChange={(e) => setCurrentSource(e.target.value)}

            // Handle source submission
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
