import Image from 'next/image';

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
  const powerBiIconFilePath = isDisabled ? "/Power-BI-Gray.png" : "/Power-BI.png";

  return (
    <button
      className={`ml flex items-center rounded px-4 py-2 font-medium shadow-md ${
        isDisabled ? "cursor-not-allowed bg-gray-300 text-gray" : "bg-[#f2c811] text-black"
      }`}
      onClick={handleCopyClick}
      disabled={isDisabled}
    >
      <Image src={powerBiIconFilePath} width={24} height={24} alt="" className="mr-2" />
      Copy PowerBI Link
    </button>
  );
}
