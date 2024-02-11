import React, { useState } from "react";
import FileTag from "./FileTag";
import type { Tag } from "~/utils/types";
import { isKeyboardEvent } from "~/utils/keyboardEvent";
import { Tooltip } from 'react-tooltip'

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

  const handleRemoveTag = (tag: Tag) => {
    setTags(getTags().filter((val, _) => val.name !== tag.name));
  };

  const updateTag = (tag: Tag, isValid: boolean) => {
    const updatedTags = getTags().map((t) =>
        t.name === tag.name
          ? { ...t, isValid: isValid }
          : t,
    );
    setTags(updatedTags);
  }

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
      <label
        data-tooltip-id="tags"
        data-tooltip-content="TODO"
        htmlFor="fileTags">Tags</label>
      <Tooltip id="tags" />
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
            onRemove={handleRemoveTag}
            updateTag={updateTag}
          />
        ))}
      </div>
    </>
  );
};

export default FileTags;
