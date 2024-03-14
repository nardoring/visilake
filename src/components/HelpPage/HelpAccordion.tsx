import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GranularitySlider from '../Form/GranularitySlider';
import { useState } from 'react';
import { granularityData } from '~/utils/granularity';
import { Typography } from '@mui/material';
import GranularitySection from './AccordionSections/GranularitySection';

export default function HelpAccordion() {
  return (
    <div className='pt-6'>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id='panel1-analysisTypes'
          className='text-2xl'
        >
          Analysis Types
        </AccordionSummary>
        <AccordionDetails>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
          malesuada lacus ex, sit amet blandit leo lobortis eget.
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id='panel2-sources'
          className='text-2xl'
        >
          Sources
        </AccordionSummary>
        <AccordionDetails>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
          malesuada lacus ex, sit amet blandit leo lobortis eget.
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id='panel3-granularity'
          className='text-2xl'
        >
          Granularity
        </AccordionSummary>
        <GranularitySection />
      </Accordion>
    </div>
  );
}
