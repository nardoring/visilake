import AccordionDetails from '@mui/material/AccordionDetails';
import { List, ListItem, Typography } from '@mui/material';

export default function AnalysisTypesSection() {
  return (
    <AccordionDetails>
      <Typography>
        The analysis type(s) input lets you choose what kind of analysis you
        want to perform on your data. You can select from three types:
      </Typography>
      <List>
        {analysisTypeExplanations.map((type, index) => (
          <ListItem key={index}>
            <Typography>
              <strong>{type.title}:</strong>&nbsp;{type.description}
            </Typography>
          </ListItem>
        ))}
      </List>
      <Typography>
        You can choose one or more of these options, and they will be applied in
        the order you select them. If you don&apos;t want to perform any
        analysis and just want to retrieve the raw data, you can choose not to
        select any options.
      </Typography>
    </AccordionDetails>
  );
}

const analysisTypeExplanations = [
  {
    title: 'Exploratory Data Analysis (EDA)',
    description:
      'This generates a comprehensive report that provides various insights into your data. It includes various metrics and visualizations that help you understand the overall structure, patterns, and characteristics of your dataset. EDA is like a first step in uncovering hidden trends, outliers, and relationships within your data.',
  },
  {
    title: 'Rolling Mean',
    description:
      "This calculates the average value of a specific number of consecutive data points. It's useful for smoothing out fluctuations or noise in your data and highlighting long-term trends. By computing the rolling mean, you can better identify underlying patterns or changes over time, especially in time series data.",
  },
  {
    title: 'Correlation',
    description:
      'This analysis measures the strength and direction of the relationship between different variables in your dataset. It helps you understand how changes in one variable might affect another.',
  },
];
