
interface PowerBIButtonProps {
  link: string;
  status: string;
}

export default function PowerBIButton({ link, status }: PowerBIButtonProps) {
   const handleCopyClick = () => {
      navigator.clipboard.writeText(link)
        .then(() => {
          // TODO: Add popup to indicate to the user the link was copied
          //console.log('Link copied to clipboard:', link);
        })
        .catch(() => {
          //console.error('Unable to copy link to clipboard', error);
        });
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
