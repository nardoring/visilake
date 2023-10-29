import React, { useState } from "react";
import FileTag from "./FileTag";

export default function Form() {
  const inputStyles =
    "block w-full rounded-md border-0 py-1.5 pl-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-300 sm:text-sm sm:leading-6";

  const handleKeyDown = (e: { key: string; preventDefault: () => void; }) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent Enter key from submitting the form
    }
  };

  return (
    <form
      className="mx-auto max-w-screen-md p-4"
    >
      <div className="font-nunito mt-10 grid grid-cols-2 gap-x-6 gap-y-4 rounded border border-slate-400 bg-lightBlue p-4 font-medium shadow-md">
        <div>
          <label htmlFor="useCaseTitle">Use Case Title</label>
          <input className={inputStyles} type="text" id="useCaseTitle" onKeyDown={handleKeyDown}/>
        </div>
        <div>
          <label htmlFor="analysisType">Analysis Type</label>
          <select className={inputStyles} id="analysisType">
            <option>Analysis Type 1</option>
            <option>Analysis Type 2</option>
            <option>Analysis Type 3</option>
          </select>
        </div>
        <div className="col-span-2">
          <FileTag></FileTag>
        </div>
        <div className="col-span-2">
          <label htmlFor="useCaseDescription">Use Case Description</label>
          <textarea className={inputStyles} rows={4} id="useCaseDescription" onKeyDown={handleKeyDown}/>
        </div>
        <div className="col-span-2 flex justify-center">
          <button
            className="rounded bg-darkBlue px-4 py-2 text-white shadow-md"
            type="submit"
          >
            Submit Use Case
          </button>
        </div>
      </div>
    </form>
  );
}
