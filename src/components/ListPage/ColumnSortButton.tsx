import {
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface ColumnSortButtonProps {
  columnSortToggle: ((event: unknown) => void) | undefined;
}

export default function ColumnSortButton({
  columnSortToggle,
}: ColumnSortButtonProps) {
  const [sortIcon, setSortIcon] = useState<IconDefinition>(faSortDown);

  function updateSortIcon(event: React.MouseEvent<SVGSVGElement>): void {
    if (columnSortToggle) {
      columnSortToggle(event);
      setSortIcon((prevSortIcon) =>
        prevSortIcon === faSortDown
          ? faSortUp
          : prevSortIcon === faSortUp
            ? faSort
            : faSortDown,
      );
    }
  }

  return (
    <FontAwesomeIcon
      icon={sortIcon}
      className="ml-3 mr-1 h-5 w-5 text-darkBlue"
      onClick={updateSortIcon}
    />
  );
}
