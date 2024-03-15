import AccordionDetails from '@mui/material/AccordionDetails';
import { SetStateAction, useState } from 'react';
import {
  Accordion,
  Icon,
  List,
  ListItem,
  TextField,
  Typography,
} from '@mui/material';
import Sources from '~/components/Form/Sources';
import { Source } from '~/utils/types';
import CheckIcon from '@mui/icons-material/Check';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const sourceTagValidator = RegExp(/^\d{4}-[A-Z]{2,3}-\d{5}$/);

export default function SourcesSection() {
  const [source, setSource] = useState<string>('');
  const [validSource, setValidSource] = useState<boolean>(false);

  return (
    <div>
      <AccordionDetails>
        <Typography className='pl-2'>
          The Sources input enables you to enter the source tags for the data
          you would like to analyze. <br /> The format used for the tags, is a custom
          ISA 5.1 format: 
          <strong>1234-AB(C)-12345</strong>
          <br />
        </Typography>
        <List className='pl-5'>
          <ListItem>
            <strong>'1234' - Area Location Code - Must be 4 digits</strong> <br />
          </ListItem>
          <ListItem>
            <strong>'AB' or 'ABC'  - ISA Tag Standard Identifier - Must be 2-3 letters</strong>
          </ListItem>
          <ListItem>
            <strong>'12345' - Device Number - Must be 5 digits</strong> 
          </ListItem>
        </List>
        <Typography variant='h5'>Examples</Typography>
        <br />

        <br />
        <Typography variant='h5'>Try it Yourself</Typography>
        <br />
        <div className='flex px-3'>
          <TextField
            placeholder='1234-AB(C)-12345'
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setValidSource(sourceTagValidator.test(e.target.value));
            }}
          />
          <Typography className='px-5 py-4'>
            <span
              className={`${validSource ? 'text-green-500' : 'text-red-500'}`}
            >
              {source}
            </span>{' '}
            is {validSource ? 'valid' : 'invalid'}.
          </Typography>
          <CheckIcon
            style={{ fill: 'green' }}
            fontSize='large'
          />
        </div>
      </AccordionDetails>
    </div>
  );
}
