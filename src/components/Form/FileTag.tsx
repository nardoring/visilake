import React, { useState } from "react";

function FileTag() {
  const inputStyles =
    "block w-full rounded-md border-0 py-1.5 pl-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-300 sm:text-sm sm:leading-6";
  const [chips, setChips] = useState<string[]>([]);
  const [currentChip, setCurrentChip] = useState<string>("");

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      if (currentChip.trim() !== "") {
        setChips([...chips, currentChip]);
        setCurrentChip("");
      }
    }
  };

  const removeChip = (index: number) => {
    const updatedChips = chips.filter((_, i) => i !== index);
    setChips(updatedChips);
  };

  return (
    <>
      <label htmlFor="fileTags">File Tags</label>
      <input
        className={inputStyles}
        type="text"
        id="fileTags"
        value={currentChip}
        onChange={(e) => setCurrentChip(e.target.value)}
        onKeyDown={handleInputKeyPress}
      />
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <div
            key={index}
            className="m-1 flex items-center justify-center rounded-full border border-green-300 bg-green-100 px-2 py-1 font-medium text-green-700"
          >
            <div className="max-w-full flex-initial text-xs font-normal leading-none">
              {chip}
            </div>
            <div
              className="flex flex-auto flex-row-reverse"
              onClick={() => removeChip(index)}
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="feather feather-x ml-2 h-4 w-4 cursor-pointer rounded-full hover:text-indigo-400"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default FileTag;
