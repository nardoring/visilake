interface ParallelogramProps {
  angle: number;
  width: string; // for responsive units like 'vw'
  height: string;
  style?: React.CSSProperties;
}

const Parallelogram: React.FC<ParallelogramProps> = ({ angle, width, height, style }) => {
  const parallelogramStyle: React.CSSProperties = {
    ...style,
    width,
    height,
    zIndex: '0',
    transform: `skew(${angle}deg)`,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    backgroundBlendMode: 'multiply',
  };

  return <div style={parallelogramStyle} />;
};

export default Parallelogram;
