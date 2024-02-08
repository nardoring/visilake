import React, { useState } from "react";
import FileTags from "./FileTags";
import FormPopup from "./FormPopup";
import { MultiSelect } from "react-multi-select-component";
import { api } from "~/utils/api";
import type { AnalysisTypeOption, Tag } from "~/utils/types";

export default function Form() {
  const inputStyles =
    "block w-full rounded-md border-0 py-1.5 pl-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-300";

  const [useCaseTitle, setUseCaseTitle] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [useCaseDescription, setUseCaseDescription] = useState("");
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
        }),
      ) ?? [];

  const getTags = (): Tag[] => {
    return tags;
  };

  const getValidTags = (): string[] => {
    return (
      tags.filter((tag) => tag.isValid === true).map((tag) => tag.name) || []
    );
  };

  // Prevent Enter key from submitting the form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const useCaseSubmission = api.useCase.submitUseCase.useMutation();

  // Check that all input fields have some value
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (
      useCaseTitle.trim() !== "" &&
      analysisTypes.length !== 0 &&
      getValidTags().length !== 0 &&
      useCaseDescription.trim() !== ""
    ) {
      const analysisTypeNames: string[] = analysisTypes.map(
        (type) => type.label,
      );
      try {
        await useCaseSubmission.mutateAsync({
          tags: getValidTags(),
          useCaseDescription: useCaseDescription,
          useCaseName: useCaseTitle,
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
      className="mx-auto max-w-screen-md p-4 "
      onSubmit={handleSubmit}
      id="useSubmissionCaseForm"
    >
      <div className="font-nunito mt-10 grid grid-cols-2 gap-x-6 gap-y-4 rounded border border-slate-400 bg-lightBlue p-4 font-medium shadow-md">
        <div>
          <label htmlFor="useCaseTitle">Use Case Title</label>
          <input
            className={`${inputStyles} ${
              submitAttempted && useCaseTitle.trim() === ""
                ? "ring-2 ring-red-500"
                : ""
            }`}
            type="text"
            id="useCaseTitle"
            onKeyDown={handleKeyDown}
            onChange={(e) => setUseCaseTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="analysisType">Analysis Type(s)</label>
          <MultiSelect
            options={analysisTypeOptions}
            value={analysisTypes}
            onChange={setAnalysisTypes}
            labelledBy="AnalysisTypeSelect"
            isLoading={analysisTypeOptionsIsLoading}
            hasSelectAll={false}
            disableSearch={true}
            className={`${"rounded shadow-sm"} ${
              submitAttempted && analysisTypes.length === 0
                ? "ring-2 ring-red-500"
                : ""
            }`}
          />
        </div>
        <div className="col-span-2">
          <FileTags
            getTags={getTags}
            setTags={setTags}
            inputStyles={`${inputStyles} ${
              submitAttempted && getValidTags().length === 0
                ? "ring-red-500 ring-2"
                : ""
            }`}
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="useCaseDescription">Use Case Description</label>
          <textarea
            className={`${inputStyles} ${
              submitAttempted && useCaseDescription.trim() === ""
                ? "ring-2 ring-red-500"
                : ""
            }`}
            rows={4}
            id="useCaseDescription"
            onKeyDown={handleKeyDown}
            onChange={(e) => setUseCaseDescription(e.target.value)}
          />
        </div>
        <div className="col-span-2 flex justify-center ">
          <button
            className="w-40 rounded bg-veryDarkBlue px-4 py-2 text-white shadow-md hover:bg-darkBlue flex justify-center items-center"
            type="submit"
            disabled={useCaseSubmission.isLoading}
          >
            {useCaseSubmission.isLoading ? (
              <div>
                <svg
                  className="text-white-200 h-6 w-6 animate-spin fill-white dark:text-gray-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              "Submit Use Case"
            )}
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
