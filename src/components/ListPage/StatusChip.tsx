import { CustomCellRendererProps } from 'ag-grid-react';

/* TODO use tailwind for this eventually */
const statusStyles = {
  complete: {
    backgroundColor: "#CEEEDD",
    borderColor: "#00A13A",
    color: "#7E8285",
  },
  inprogress: {
    backgroundColor: "#C9E8FB",
    borderColor: "#1790D0",
    color: "#7E8285",
  },
  notstarted: {
    backgroundColor: "#FFF2CC",
    borderColor: "#FFE699",
    color: "#7E8285",
  },
  failed: {
    backgroundColor: "#F4CCDB",
    borderColor: "#C9024A",
    color: "#7E8285",
  },
  default: {
    backgroundColor: "#BFC3C6",
    borderColor: "#7E8285",
    color: "#7E8285",
  },
};

export default function StatusChip(props: CustomCellRendererProps) {
  const statusMap: Record<string, string> = {
    complete: "Completed",
    inprogress: "In Progress",
    notstarted: "Queued",
    failed: "Failed",
  };

  const statusKey = props.value.toLowerCase().replace(/\s+/g, "");
  const statusValue = statusMap[statusKey] ?? "INVALID";
  const style =
    statusStyles[statusKey as keyof typeof statusStyles] ||
    statusStyles.default;

  return (
    <div className={`flex flex-wrap gap-2 py-3`}>
      <div
        className={`m-1 flex min-w-[8rem] items-center justify-center rounded-full border px-2 py-1 text-xs font-medium`}
        style={style}
      >
        <div className="max-w-full flex-initial leading-none">
          {statusValue}
        </div>
      </div>
    </div>
  );
}
