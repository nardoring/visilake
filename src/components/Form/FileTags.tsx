import React, { useState } from "react";
import { api } from "~/utils/api";
import FileTag from "./FileTag";
import { Tag } from "~/utils/types";

interface FileTagsProps {
  getTags: () => Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  inputStyles: string;
}

const FileTags: React.FC<FileTagsProps> = React.memo(
  ({ getTags, setTags, inputStyles }) => {
    const [currentTag, setCurrentTag] = useState<string>("");

  const handleTagEntry = (
      e:
        | React.KeyboardEvent<HTMLInputElement>
        | React.FocusEvent<HTMLInputElement>,
    ) => {
      // Check if it's a keyboard event and if 'Enter' was pressed
    if (e instanceof KeyboardEvent && e.key === "Enter") {
        e.preventDefault(); // Prevent form submission
        if (currentTag.trim() !== "" && !getTags().some((tag) => tag.name === currentTag)) {
          setTags([...getTags(), {name: currentTag, isValid: false}])
          setCurrentTag("");
        }
      }
      // Check if it's a blur event
    else if (e.type === "blur") {
      if (currentTag.trim() !== "" && !getTags().some((tag) => tag.name === currentTag)) {
        setTags([...getTags(), {name: currentTag, isValid: false}])
        setCurrentTag("");
      }
    }

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
        <div className="flex flex-wrap gap-0">
          {getTags().map((tag) => (
            <FileTag
              key={`file-tag-${tag.name}`}
              tag={tag}
              getTags={getTags}
              setTags={setTags}
            />
          ))}
        </div>
      </>
    );
  },
);

export default FileTags;
