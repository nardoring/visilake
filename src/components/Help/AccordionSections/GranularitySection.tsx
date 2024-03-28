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

  function getGranularityDisplayLabel(value: number) {
    const label =
      granularityData.find((item) => item.value === value)?.label ?? '';
    return label ? `Datapoints will be ${label} apart` : '';
  }

  return (
    <div>
      <AccordionDetails>
        <Typography className='pl-7'>
          The granularity input enables you to adjust the time intervals between
          data points in your analysis. Granularity determines the level of
          detail in your analysis, ranging from finer to broader time intervals.
          By using the slider, you can choose to examine data with more precise
          time intervals or broader ones, allowing you to customize your
          analysis to focus on specific details or broader trends.
          <br />
          <br />
          If the granularity you select is finer than what the data supports,
          the system will automatically default to the lowest available
          granularity for the dataset
        </Typography>
        <Typography className='pt-4'></Typography>
        <Typography
          variant='h6'
          sx={{ fontWeight: 'bold' }}
          className='pb-3'
        >
          Try it Yourself
        </Typography>
        <div className='px-10'>
          <GranularitySlider onGranularityChanged={onGranularityChanged} />
          <Typography className='text-center'>
            {getGranularityDisplayLabel(granularity)}
          </Typography>
        </div>
      </AccordionDetails>
    </div>
  );
}
