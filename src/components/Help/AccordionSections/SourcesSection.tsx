import AccordionDetails from '@mui/material/AccordionDetails';
import { List, ListItem, Typography } from '@mui/material';
import Image from 'next/image';

const examples = {
  'Flow Instruments': [
    {
      tag: '1001-FI-50230',
      description: 'Flow Indicator in area 1001, device number 50230',
    },
    {
      tag: '1002-FT-50440',
      description: 'Flow Transmitter in area 1002, device number 50440',
    },
    {
      tag: '1003-FIC-50650',
      description:
        'Flow Indicating Controller in area 1003, device number 50650',
    },
  ],
  'Temperature Instruments': [
    {
      tag: '2001-TI-60210',
      description: 'Temperature Indicator in area 2001, device number 60210',
    },
    {
      tag: '2002-TT-60420',
      description: 'Temperature Transmitter in area 2002, device number 60420',
    },
    {
      tag: '2003-TIC-60630',
      description:
        'Temperature Indicating Controller in area 2003, device number 60630',
    },
  ],
  'Pressure Instruments': [
    {
      tag: '3001-PI-70270',
      description: 'Pressure Indicator in area 3001, device number 70270',
    },
    {
      tag: '3002-PT-70480',
      description: 'Pressure Transmitter in area 3002, device number 70480',
    },
    {
      tag: '3003-PIC-70690',
      description:
        'Pressure Indicating Controller in area 3003, device number 70690',
    },
  ],
};

export default function SourcesSection() {
  return (
    <AccordionDetails>
      <div className='pl-5'>
        <Typography className='pb-3 pl-2'>
          The sources input enables you to enter the source tags for the data
          you would like to analyze. Each source tag is associated with time
          series data for the device specified by the tag. The format used for
          the tags is a custom ISA 5.1 format:
        </Typography>
        <div className='flex items-center justify-center'>
          <div className='mx-auto my-auto h-1/2 w-1/2'>
            <Image
              src={'/Source-Tag-Format.png'}
              alt={''}
              width={1892}
              height={567}
            />
          </div>
        </div>
        <Typography variant='h5'>
          <strong>Examples</strong>
        </Typography>
        <div className='py-5 pl-5'>
          {Object.entries(examples).map(([category, tags]) => (
            <div key={category}>
              <Typography variant='h6'>{category}</Typography>
              <List>
                {tags.map(({ tag, description }) => (
                  <ListItem key={tag}>
                    <strong>{tag}:</strong>&nbsp;{description}
                  </ListItem>
                ))}
              </List>
            </div>
          ))}
        </div>
      </div>
    </AccordionDetails>
  );
}
