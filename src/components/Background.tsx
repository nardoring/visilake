import React, { useState, useEffect, ReactNode } from 'react';
import Parallelogram from './Parallelogram';
import Navbar from './Navbar';
import Logo from './Logo';
import Bar from './Bar';

type BackgroundProps = {
  children: ReactNode;
};

const Background = ({ children }: BackgroundProps) => {
  return (
    <div
      className='bg-blue'
      style={{
        minHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        position: 'relative',
      }}
    >
      <div
        className='grid-container'
        style={{
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            marginTop: '115px',
            display: 'flex',
            gridRow: '1',
            position: 'relative',
            gridColumnStart: '2',
            gridColumnEnd: '10',
          }}
        >
          <div
            className='bg-white'
            style={{
              position: 'absolute',
              top: '-115px',
              left: '-50em',
              zIndex: '10',
              transform: `skew(-22.4deg) `,
              transformOrigin: 'bottom',
              width: '50.5em',
              height: '115px',
            }}
          ></div>
          <Parallelogram
            angle={-22.4}
            //angle={0}
            width={'100%'}
            height='115px'
            style={{
              position: 'relative',
              top: '-115px',
              zIndex: '10',
            }}
            transformOrigin='bottom'
            className='top-bar'
          />
          <Bar
            angle={-22.4}
            //angle={0}
            width={'100%'}
            height='100%'
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Navbar />
          </Bar>
          <Logo
            style={{
              width: '285px',
              height: '100px',
              marginRight: '0px',
              gridRow: '2',
              gridColumnEnd: '9',
            }}
          />
        </div>
        <Parallelogram
          angle={-22.4}
          //angle={0}
          width={'1000px'}
          height='2400px'
          style={{
            position: 'relative',
            gridRow: '3',
            gridColumn: '10',
          }}
          transformOrigin='top'
        />
        <div
          style={{
            gridColumnStart: '2',
            gridColumnEnd: '10',
            gridRow: '3',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Background;
