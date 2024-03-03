import React from 'react';
import type { ReactNode } from 'react';
import Parallelogram from './Parallelogram';
import Navbar from './Navbar';
import Logo from './Logo';
import Bar from './Bar';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const TOP_BAR_HEIGHT = '9.5em';

  return (
    <div className='max-w-screen relative min-h-screen w-screen bg-blue'>
      <div className='grid-container overflow-hidden'>
        <div
          className='relative col-start-2 col-end-10 flex'
          style={{ marginTop: TOP_BAR_HEIGHT }}
        >
          <Parallelogram
            angle={-22.4}
            width={'50.5em'}
            height={TOP_BAR_HEIGHT}
            style={{
              position: 'absolute',
              top: `-${TOP_BAR_HEIGHT}`,
              left: '-50em',
              zIndex: '10',
            }}
            transformOrigin='bottom'
          />
          <Parallelogram
            angle={-22.4}
            width={'100%'}
            height={TOP_BAR_HEIGHT}
            style={{
              position: 'relative',
              top: `-${TOP_BAR_HEIGHT}`,
              zIndex: '10',
            }}
            transformOrigin='bottom'
          />
          <div className='absolute flex h-full w-full items-center'>
            <Navbar />
          </div>
          <Bar
            angle={-22.4}
            width='100%'
            height='100%'
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
            }}
          />
          <div className='flex h-full items-center'>
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
        </div>
        <Parallelogram
          angle={-22.4}
          width={'10000px'}
          height='1500px'
          style={{
            position: 'relative',
            gridRow: '3',
            gridColumn: '10',
            zIndex: 0,
          }}
          transformOrigin='top'
        />
        <div className='z-10 col-start-2 col-end-10 row-span-3'>{children}</div>
      </div>
    </div>
  );
};

export default Layout;
