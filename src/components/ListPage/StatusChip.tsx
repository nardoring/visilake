interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  const statusMap: Record<string, string> = {
    complete: "Complete",
    inprogress: "In Progress",
    notstarted: "Not Started",
    failed: "Failed",
  };

  const statusKey = status.toLowerCase();
  const statusValue = statusMap[statusKey] ?? "INVALID";

  const statusClasses =
    {
      complete: "bg-green-100 border-green-300 text-green-700",
      inprogress: "bg-blue-100 border-blue-300 text-blue-700",
      notstarted: "bg-yellow-100 border-yellow-300 text-yellow-700",
      failed: "bg-red-100 border-red-300 text-red-700",
    }[statusKey] ?? "bg-gray-300 border-gray-400 text-gray-700";

  return (
    <div className={`flex flex-wrap gap-2`}>
      <div
        className={`m-1 flex items-center justify-center rounded-full border ${statusClasses} w-[5.1rem] px-2 py-1 text-xs font-medium`}
      >
        <div className="max-w-full flex-initial leading-none">
          {statusValue}
        </div>
      </div>
    </div>
  );
}
