interface BarProps {
  angle: number;
  width: string; // for responsive units like 'vw'
  height: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const Bar: React.FC<BarProps> = ({ angle, width, height, style, children }) => {
  const BarStyle: React.CSSProperties = {
    ...style,
    width,
    height,
    zIndex: "0",
    transform: `skewX(${angle}deg)`,
    transformOrigin: "bottom",
  };

  return (
    <div style={BarStyle} className="bg-darkBlue">
      {children}
    </div>
  );
};

export default Bar;
