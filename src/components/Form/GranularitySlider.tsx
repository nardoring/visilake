import Slider from '@mui/material/Slider';
import type { Dispatch, SetStateAction } from 'react';
import { granularityData } from '~/utils/granularity';

interface GranularitySliderProps {
  setGranularity: Dispatch<SetStateAction<number>>;
}

export default function GranularitySlider({
  setGranularity,
}: GranularitySliderProps) {
  const granularities = granularityData.map((data: { value: number; }) => data.value);
  const labels = granularityData.map((data: { label: string; }) => data.label);

  const marks = granularities.map((value, index) => ({
    value: index + 1,
    label: labels[index],
  }));

  function calculateValue(value: number) {
    return granularities[value - 1] ?? -1;
  }

  const handleChange = (event: Event, newValue: number | number[]) => {
    setGranularity(calculateValue(newValue as number));
  };

  return (
    <Slider
      marks={marks}
      min={1}
      scale={calculateValue}
      max={marks.length}
      step={null}
      onChange={handleChange}
    ></Slider>
  );
}
