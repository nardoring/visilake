import Slider from '@mui/material/Slider';
import type { Dispatch, SetStateAction } from 'react';
import { granularityData } from '~/utils/granularity';

interface GranularitySliderProps {
  onGranularityChanged: (newValue: number) => void;
}

export default function GranularitySlider({
  onGranularityChanged,
}: GranularitySliderProps) {
  const granularities = granularityData.map(
    (data: { value: number }) => data.value
  );
  const labels = granularityData.map((data: { label: string }) => data.label);

  const marks = granularities.map((value, index) => ({
    value: index + 1,
    label: labels[index],
  }));

  function calculateGranularity(value: number) {
    return granularities[value - 1] ?? -1;
  }

  const handleChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      onGranularityChanged(calculateGranularity(newValue));
    }
  };

  return (
    <Slider
      marks={marks}
      min={1}
      scale={calculateGranularity}
      max={marks.length}
      step={null}
      onChange={handleChange}
    ></Slider>
  );
}
