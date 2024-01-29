import { faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ColumnSortButtonProps {
  columnSortToggle: ((event: unknown) => void) | undefined;
}

export default function ColumnSortButton({
  columnSortToggle
}: ColumnSortButtonProps) {
  return (
    <FontAwesomeIcon
      icon={faSort}
      className="ml-3 mr-1 h-5 w-5 text-darkBlue"
      onClick={columnSortToggle}
    />
  );
}
