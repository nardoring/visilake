import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatusChip from "./StatusChip";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function FilterDropdown() {
  return (
    <Menu as="div" className="relative inline-block text-left pl-5">
      <div>
        <Menu.Button>
          <FontAwesomeIcon
            icon={faFilter}
            className="-mr-1 h-5 w-5 text-darkBlue"
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
        <Menu.Items className="absolute left-0 z-10 mt-2 px-@ origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <StatusChip status={"Complete"}/>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <StatusChip status={"InProgress"}/>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <StatusChip status={"NotStarted"}/>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <StatusChip status={"Failed"}/>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
