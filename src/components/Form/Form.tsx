import React, { useState } from 'react';
import Sources from './Sources';
import FormPopup from './FormPopup';
import { MultiSelect } from 'react-multi-select-component';
import { api } from '~/utils/api';
import type { AnalysisTypeOption, Source } from '~/utils/types';
import LoadingIcon from './LoadingIcon';
import { Tooltip } from 'react-tooltip';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import GranularitySlider from './GranularitySlider';

export default function Form() {
  const inputStyles =
    'sticky top-0 col-start-2 col-end-9 block w-full rounded-md border-0 py-1.5 pl-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo';

  const [jobName, setJobName] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisTypeOption[]>([]);
  const {
    data: analysisTypeOptionsData,
    isLoading: analysisTypeOptionsIsLoading,
  } = api.analysis.getAnalysisTypes.useQuery();
  const [showPopup, setShowPopup] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const analysisTypeOptions: AnalysisTypeOption[] = analysisTypeOptionsIsLoading
    ? []
    : analysisTypeOptionsData?.types?.map(
        (option: { name: string; id: number }) => ({
          label: option.name,
          value: option.id,
        })
      ) ?? [];

  const getSources = (): Source[] => {
    return sources;
  };

  const getValidSources = (): string[] => {
    return (
      sources
        .filter((source) => source.isValid === true)
        .map((source) => source.name) || []
    );
  };

  // Prevent Enter key from submitting the form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const jobSubmission = api.job.submitJob.useMutation();

  // Check that all input fields have some value
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (
      jobName.trim() !== '' &&
      analysisTypes.length !== 0 &&
      getValidSources().length !== 0 &&
      jobDescription.trim() !== ''
    ) {
      const analysisTypeNames: string[] = analysisTypes.map(
        (type) => type.label
      );
      try {
        await jobSubmission.mutateAsync({
          sources: getValidSources(),
          jobDescription: jobDescription,
          jobName: jobName,
          analysisTypes: analysisTypeNames,
        });
        setFormSuccess(true);
      } catch (error) {
        setFormSuccess(false);
        console.log(error);
      }
      setShowPopup(true);
    }
  }

  return (
    <form
      className='z-40 col-start-2 col-end-9 row-span-6 row-start-3 p-4 '
      onSubmit={handleSubmit}
      id='jobSubmissionForm'
    >
      <div className='font-nunito mt-12 grid grid-cols-2 gap-x-6 gap-y-4 rounded border border-slate-400 bg-veryLightGrey p-4 font-medium shadow-md'>
        <div>
          <label
            data-tooltip-id='name'
            data-tooltip-html='Short name of job or task'
            htmlFor='jobName'
          >
            Job Name
          </label>
          <Tooltip id='name' />

          <input
            className={`${inputStyles} ${
              submitAttempted && jobName.trim() === '' ? 'ring-2 ring-red' : ''
            }`}
            type='text'
            id='jobName'
            onKeyDown={handleKeyDown}
            onChange={(e) => setJobName(e.target.value)}
          />
        </div>
        <div>
          <label
            data-tooltip-id='types'
            data-tooltip-html='Analysis to be ran on selected source(s) <br> Multiple types may be selected'
            htmlFor='analysisType'
          >
            Analysis Type(s)
          </label>
          <Tooltip id='types' />
          <MultiSelect
            options={analysisTypeOptions}
            value={analysisTypes}
            onChange={setAnalysisTypes}
            labelledBy='AnalysisTypeSelect'
            isLoading={analysisTypeOptionsIsLoading}
            hasSelectAll={false}
            disableSearch={true}
            className={`${'rounded shadow-sm'} ${
              submitAttempted && analysisTypes.length === 0
                ? 'ring-1 ring-red'
                : ''
            }`}
          />
        </div>
        <div className='col-span-2'>
          <Sources
            getSources={getSources}
            setSources={setSources}
            inputStyles={`${inputStyles} ${
              submitAttempted && getValidSources().length === 0
                ? 'ring-red ring-1'
                : ''
            }`}
          />
        </div>
        <div className='flex flex-col'>
          <label
            className='mb-1'
            data-tooltip-id='date-range'
            data-tooltip-html='Select the date and time range for the analysis. You can choose both the start and end dates along with their respective times.'
          >
            Date Range
          </label>
          <Tooltip id='date-range' />
          <div className='col-span-1 flex w-full flex-row space-x-4'>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                disableFuture
                className='w-full'
              />
              <p className='text-3xl'> - </p>
              <DateTimePicker
                disableFuture
                className='w-full'
              />
            </LocalizationProvider>
          </div>
        </div>
        <div className='flex flex-col'>
          <label
            className='mb-1'
            data-tooltip-id='granularity'
            data-tooltip-html='...'
          >
            Granularity
          </label>
          <Tooltip id='granularity' />
          <div className='px-5'>
            <GranularitySlider />
          </div>
        </div>
        <div className='col-span-2'>
          <label
            data-tooltip-id='desc'
            data-tooltip-html='Details about:<br>- sources<br>- analysis type<br>- hypothesis<br>- expectations<br>- additional notes'
            htmlFor='jobDescription'
          >
            Description
          </label>
          <Tooltip id='desc' />
          <textarea
            className={`${inputStyles} ${
              submitAttempted && jobDescription.trim() === ''
                ? 'ring-1 ring-red'
                : ''
            }`}
            rows={4}
            id='jobDescription'
            onKeyDown={handleKeyDown}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
        <div className='col-span-2 flex justify-center '>
          <button
            className='flex w-40 items-center justify-center rounded bg-veryDarkBlue px-4 py-2 text-white shadow-md hover:bg-highlightBlue'
            type='submit'
            disabled={jobSubmission.isLoading}
          >
            {jobSubmission.isLoading ? <LoadingIcon /> : 'Submit Job'}
          </button>
        </div>
        <FormPopup
          formSuccess={formSuccess}
          showPopup={showPopup}
          setShowPopup={setShowPopup}
        />
      </div>
    </form>
  );
}
