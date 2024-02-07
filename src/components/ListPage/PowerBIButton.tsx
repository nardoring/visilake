import Image from "next/image";
import { Bounce, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface PowerBIButtonProps {
  link: string;
  status: string;
}

export default function PowerBIButton({ link, status }: PowerBIButtonProps) {
  const notifyLinkCopied = () => {
    toast.success("PowerBI Link Copied", {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition: Bounce,
    });
  };

  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        notifyLinkCopied();
      })
      .catch(() => {
        //console.error('Unable to copy link to clipboard', error);
      });
  };

  const isDisabled = status !== "Complete";
  const powerBiIconFilePath = isDisabled
    ? "/Power-BI-Gray.png"
    : "/Power-BI.png";

  return (
    <>
      <button
        className={`ml flex items-center rounded px-4 py-2 font-medium shadow-md ${
          isDisabled
            ? "text-gray cursor-not-allowed bg-gray-300"
            : "bg-[#f2c811] text-black"
        }`}
        onClick={handleCopyClick}
        disabled={isDisabled}
      >
        <Image
          src={powerBiIconFilePath}
          width={24}
          height={24}
          alt=""
          className="mr-2"
        />
        Copy PowerBI Link
      </button>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
