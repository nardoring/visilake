import React, { useState } from "react";
import FileTag from "./FileTag";
import { Tag } from "~/utils/types";

interface FileTagsProps {
  getTags: () => Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  inputStyles: string;
}

const FileTags  = ({ getTags, setTags, inputStyles }: FileTagsProps) => {
  const [currentTag, setCurrentTag] = useState<string>("");

  const checkTagEntry = () => {
    if (
      currentTag.trim() !== "" &&
      !getTags().some((tag) => tag.name === currentTag)
    ) {
      setTags([...getTags(), { name: currentTag, isValid: false }]);
      setCurrentTag("");
    }
  };

  const isKeyboardEvent = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>,
  ): e is React.KeyboardEvent<HTMLInputElement> => {
    return (e as React.KeyboardEvent<HTMLInputElement>).key !== undefined;
  };

  const handleTagEntry = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>,
  ) => {
    if (isKeyboardEvent(e) && e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      checkTagEntry();
    } else if (e.type === "blur") {
      checkTagEntry();
    }
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
};

export default FileTags;
