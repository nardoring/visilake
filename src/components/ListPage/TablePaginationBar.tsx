import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { Table } from "@tanstack/react-table";
import type { UseCase } from "~/models/useCase";

interface TablePaginationBarProps {
  table: Table<UseCase>,
}

export default function TablePaginationBar({ table }: TablePaginationBarProps) {
    const pageCount = table.getPageCount();
    const pageIndex = table.getState().pagination.pageIndex + 1;
  
    const renderPaginationButtons = () => {
      const buttons = [];
  
      for (let i = 1; i <= pageCount; i++) {
        buttons.push(
          <a
            key={i}
            href="#"
            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
              i === pageIndex
                ? 'bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
            }`}
          >
            {i}
          </a>
        );
      }
  
      return buttons;
    };
  
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{pageIndex}</span> of{" "}
              <span className="font-medium">{pageCount}</span> results
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              {/* Previous Button */}
              <button
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
  
              {/* Dynamically generated Pagination Buttons */}
              {renderPaginationButtons()}
  
              {/* Next Button */}
              <button
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  }
