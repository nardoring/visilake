import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GranularitySection from './AccordionSections/GranularitySection';
import SourcesSection from './AccordionSections/SourcesSection';
import AnalysisTypesSection from './AccordionSections/AnalysisTypesSection';
import { Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function HelpAccordion() {
  return (
    <div className='pt-6'>
      <Typography className='text-white text-center text-bold pb-2' variant='h4'><strong>Additional Information</strong></Typography>
      {/* <HelpOutlineIcon style={{ fill: 'white' }} fontSize='large'/> */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id='panel1-analysisTypes'
          className='text-[1.3rem] font-bold'
        >
          Analysis Type(s)
        </AccordionSummary>
        <AnalysisTypesSection/>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id='panel2-sources'
          className='text-[1.3rem] font-bold'
        >
          Sources
        </AccordionSummary>
        <SourcesSection/>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id='panel3-granularity'
          className='text-[1.3rem] font-bold'
        >
          Granularity
        </AccordionSummary>
        <GranularitySection />
      </Accordion>
    </div>
  );
}
