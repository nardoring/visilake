import AccordionDetails from '@mui/material/AccordionDetails';
import GranularitySlider from '~/components/Form/GranularitySlider';
import { useState } from 'react';
import { granularityData } from '~/utils/granularity';
import { Typography } from '@mui/material';

export default function GranularitySection() {
  const [granularity, setGranularity] = useState<number>(
    granularityData[0]?.value ?? -1
  );

  const onGranularityChanged = (newValue: number) => {
    setGranularity(newValue);
  };

  function getGranularityLabel(value: number) {
    return granularityData.find((item) => item.value === value)?.label ?? -1;
  }
  return (
    <div>
      <AccordionDetails>
        <Typography>
          The granularity input enables you to adjust the time intervals between
          data points in your analysis. Granularity determines the level of
          detail in your analysis, ranging from finer to broader time intervals.
          By using the slider, you can choose to examine data with more precise
          time intervals or broader ones, allowing you to customize your
          analysis to focus on specific details or broader trends.
        </Typography>
        <br />
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>Try it Yourself</Typography>
        <br />
        <div className='px-10'>
          <GranularitySlider onGranularityChanged={onGranularityChanged} />
          <Typography className='text-center'>
            Datapoints will be <strong>{getGranularityLabel(granularity)}</strong> apart
          </Typography>
        </div>
      </AccordionDetails>
    </div>
  );
}
