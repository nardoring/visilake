import { Fragment, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Menu, Transition } from "@headlessui/react";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatusChip from "./StatusChip";

interface FilterDropdownProps {
  dropdownItems: string[];
  filterId: string;
  setColumnFilters: Dispatch<SetStateAction<ColumnFilter[]>>;
}

export default function FilterDropdown({
  dropdownItems,
  filterId,
  setColumnFilters,
}: FilterDropdownProps) {
  // State of each checkbox in the menu, to retain its state between each opening and closing of the menu
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>(
    Object.fromEntries(dropdownItems.map((item) => [item, false])),
  );

  return (
    <Menu as="div" className="relative inline-block pl-5 text-left">
      <div>
        <Menu.Button>
          <FontAwesomeIcon
            icon={faFilter}
            className="mr-1 h-5 w-5 text-darkBlue"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="px-@ absolute left-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-3 py-2">
            {dropdownItems.sort().map((item) => (
              <Menu.Item key={item}>
                {() => (
                  <div className="flex py-1">
                    <div className="mr-3">
                      {filterId === "useCaseStatus" ? (
                        <StatusChip status={item} />
                      ) : (
                        <p className="mr-3 whitespace-nowrap text-darkBlue">
                          {item}
                        </p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="ml-auto w-5"
                      checked={checkboxValues[item]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setCheckboxValues((prev) => ({
                          ...prev,
                          [item]: e.target.checked,
                        }));
                        setColumnFilters((prev) => {
                          const existingFilterIndex = prev.findIndex(
                            (filter) => filter.id === filterId,
                          );

                          if (existingFilterIndex !== -1) {
                            // Filter exists, update its value
                            const updatedFilter = {
                              ...prev[existingFilterIndex],
                            } as ColumnFilter;
                            const newValues = e.target.checked
                              ? (updatedFilter.value as string[]).concat(item)
                              : (updatedFilter.value as string[]).filter(
                                  (s) => s !== item,
                                );

                            updatedFilter.value = newValues;
                            prev[existingFilterIndex] = updatedFilter;
                            return [...prev];
                          } else if (e.target.checked) {
                            // Filter doesn't exist, add a new one
                            return prev.concat({
                              id: filterId,
                              value: [item],
                            });
                          }
                          // No change if unchecking a checkbox when the filter doesn't exist
                          return prev;
                        });
                      }}
                    />
                  </div>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
