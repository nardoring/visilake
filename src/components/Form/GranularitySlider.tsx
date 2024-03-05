import Slider from '@mui/material/Slider';

export default function GranularitySlider() {
  const msValue = [
    1,
    5,
    10,
    100,
    1000,
    1000 * 60,
    1000 * 60 * 60,
    1000 * 60 * 60 * 24,
  ];
  const labels = ['1ms', '5ms', '10ms', '100ms', '1s', '1m', '1h', '1day'];

  const marks = msValue.map((value, index) => ({
    value: index + 1,
    label: labels[index],
  }));

  function calculateValue(value: number) {
    return msValue[value - 1] ?? -1;
  }

  return (
    <Slider
      marks={marks}
      min={1}
      scale={calculateValue}
      max={marks.length}
      step={null}
    ></Slider>
  );
}
