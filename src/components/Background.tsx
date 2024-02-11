import React, { useState, useEffect } from 'react';
import Parallelogram from './Parallelogram';

const Background = () => {
  const [width, setWidth] = useState('66vw');

  useEffect(() => {
    const handleResize = () => {
      setWidth(`${window.innerWidth * 0.66}px`);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-blue" style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
      <Parallelogram
        angle={-22.4}
        width={'4000px'}
        height="215px"
        style={{
          position: 'absolute',
          right: `255px`,
          marginTop: '-100px'
        }}
      />
      <Parallelogram
        angle={-22.4}
        width={'1000px'}
        height="2400px"
        style={{
          position: 'absolute',
          right: '-388px',
          top: '200px',
        }}
      />

    </div>
  );
};

export default Background;
