import React, { useState } from "react";
import { api } from "~/utils/api";

interface FileTagsProps {
  tags: string[],
  updateTags: (newTags: string[]) => void;
  inputStyles: string;
}

const validateTag = (tag: string) => {
  return api.tag.validateTag.useQuery({tag: tag}).data?.isValid || false
};

const FileTags: React.FC<FileTagsProps> = ({tags, updateTags, inputStyles}) => {
  const [currentTag, setCurrentTag] = useState<string>("");
  const [invalidTagErrorMessage, setInvalidTagErrorMessage] = useState<string>("");

  const handleTagEntry = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.type === "blur") {
      e.preventDefault(); // Prevent form submission
      if (currentTag.trim() !== "") {
        if (validateTag(currentTag)) {
          updateTags([...tags, currentTag]);
          setCurrentTag("");
        } else {
          setInvalidTagErrorMessage("The provided tag '" + currentTag + "' is invalid")
        }
      }
    } else if (invalidTagErrorMessage !== "") {
      setInvalidTagErrorMessage("")
    }
  };

  const removeTag = (index: number) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    updateTags(updatedTags);
  };

  return (
    <>
      <label htmlFor="fileTags">File Tags</label>
      <input
        className={inputStyles}
        type="text"
        id="fileTags"
        value={currentTag}
        onChange={(e) => setCurrentTag(e.target.value)}
        onBlur={handleTagEntry}
        onKeyDown={handleTagEntry}
      />
      <p className="text-red-700">{invalidTagErrorMessage}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <div
            key={`file tag ${index}`}
            className="m-1 flex items-center justify-center rounded-full border border-green-300 bg-green-100 px-2 py-1 font-medium text-green-700"
          >
            <div className="max-w-full flex-initial text-xs font-normal leading-none">
              {tag}
            </div>
            <div
              className="flex flex-auto flex-row-reverse"
              onClick={() => removeTag(index)}
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
};

export default FileTags;
