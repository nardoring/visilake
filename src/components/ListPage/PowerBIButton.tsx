interface PowerBIButtonProps {
  link: string;
  status: string;
}

export default function PowerBIButton({ link, status }: PowerBIButtonProps) {
  const handleCopyClick = () => {
    navigator.clipboard.writeText(link);
  };

  const isDisabled = status !== "Complete";

  return (
    <button
      className={`ml flex items-center rounded px-4 py-2 font-medium text-black shadow-md ${
        isDisabled ? "cursor-not-allowed bg-gray-300" : "bg-[#f2c811]"
      }`}
      onClick={handleCopyClick}
      disabled={isDisabled}
    >
      <img src="Power-BI.png" alt="" className="mr-2 w-6" />
      Copy PowerBI Link
    </button>
  );
}
