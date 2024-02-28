import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { Table } from "@tanstack/react-table";
import type { UseCase } from "~/models/domain/useCase";

interface TablePaginationBarProps {
  table: Table<UseCase>;
}

export default function TablePaginationBar({ table }: TablePaginationBarProps) {
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex + 1;
  const maxVisibleButtons = 6;
  const buttonSize = "w-11 h-11";

  const renderPaginationButtons = () => {
    const buttons = [];

    if (pageCount <= maxVisibleButtons) {
      // If there are fewer pages than the max visible buttons, show all buttons
      for (let i = 1; i <= pageCount; i++) {
        buttons.push(renderPageButton(i));
      }
    } else {
      // Determine the range of buttons to show based on the current page
      let start = Math.max(1, pageIndex - Math.floor(maxVisibleButtons / 2));
      let end = Math.min(pageCount, start + maxVisibleButtons - 1);

      if (pageCount - start <= maxVisibleButtons) {
        start = pageCount - maxVisibleButtons;
        end = pageCount;
      }

      // Show ellipsis if there are pages before the visible range
      if (start > 2) {
        buttons.push(renderEllipsis(0));
        start += 1;
      }

      // Show the buttons within the visible range
      for (let i = start; i <= end; i++) {
        buttons.push(renderPageButton(i));
      }

      // Show ellipsis if there are pages after the visible range
      if (end < pageCount - 1) {
        buttons.push(renderEllipsis(pageCount - 1));
      }
    }

    return buttons;
  };

  const renderPageButton = (pageNumber: number) => (
    <button
      onClick={() => table.setPageIndex(pageNumber - 1)}
      key={"paginationButton" + pageNumber}
      className={`relative inline-flex items-center ${buttonSize} px-4 py-2 text-sm font-semibold ${pageNumber === pageIndex
        ? "bg-indigo/70 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        }`}
    >
      {pageNumber}
    </button>
  );

  const renderEllipsis = (pageIndex: number) => (
    <button
      className="${buttonSize} relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
      onClick={() => table.setPageIndex(pageIndex)}
      key={"paginationEllipsesButton" + pageIndex}
    >
      ...
    </button>
  );

  return (

    <div className="items-center w-full justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">{(pageIndex - 1) * 10 + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(
                pageIndex * 10,
                table.getFilteredRowModel().rows.length,
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex space-x-px rounded-md shadow-sm">
            {/* Previous Button */}
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span className="sr-only">Previous</span>
              <FontAwesomeIcon icon={faChevronLeft} className="h-5 w-5" />
            </button>

            {/* Dynamically generated Pagination Buttons */}
            {renderPaginationButtons()}

            {/* Next Button */}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span className="sr-only">Next</span>
              <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
