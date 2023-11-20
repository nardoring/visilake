

interface PowerBIButtonProps {
  link: string;
}

export default function PowerBIButton({ link }: PowerBIButtonProps) {
  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log("Link copied to clipboard:", link);
      })
      .catch((error) => {
        console.error("Unable to copy link to clipboard", error);
      });
  };

  return (
    <button
      className="ml rounded bg-[#f2c811] px-4 py-2 text-black shadow-md flex items-center font-medium"
      onClick={handleCopyClick}
    >
      <img src="Power-BI.png" alt="" className="w-6 mr-2"/>
      Copy PowerBI Link
    </button>
  );
}
