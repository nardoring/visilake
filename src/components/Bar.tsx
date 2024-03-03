interface BarProps {
  angle: number;
  width: string; // for responsive units like 'vw'
  height: string;
  style?: React.CSSProperties;
}

const Bar: React.FC<BarProps> = ({ angle, width, height, style }) => {
  const BarStyle: React.CSSProperties = {
    ...style,
    width,
    height,
    zIndex: '0',
    transform: `skewX(${angle}deg)`,
    transformOrigin: 'bottom',
  };

  return (
    <div
      style={BarStyle}
      className='bg-darkBlue'
    />
  );
};

export default Bar;
