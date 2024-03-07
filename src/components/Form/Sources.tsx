import React, { useState } from 'react';
import Source from './Source';
import type { Source as Source_t } from '~/utils/types';
import { isKeyboardEvent } from '~/utils/keyboardEvent';

import { Tooltip } from 'react-tooltip';

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
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>
  ) => {
    if (isKeyboardEvent(e) && e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      checkSourceEntry();
    } else if (e.type === 'blur') {
      checkSourceEntry();
    }
  };

  return (
    <>
      <label
        data-tooltip-id='sources'
        data-tooltip-html='Select sources from Data Lake'
        htmlFor='sources'
      >
        Sources
      </label>
      <Tooltip id='sources' />
      <input
        className={inputStyles}
        type='text'
        id='sources'
        value={currentSource}
        onChange={(e) => setCurrentSource(e.target.value)}
        onBlur={handleSourceEntry}
        onKeyDown={handleSourceEntry}
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
