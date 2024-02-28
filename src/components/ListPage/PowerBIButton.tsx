import { CustomCellRendererProps } from "ag-grid-react";
import Image from "next/image";
import { Bounce, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Tooltip } from 'react-tooltip'

const toastProperties = {
  osition: "bottom-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  transition: Bounce,
};

export default function PowerBIButton(props: CustomCellRendererProps) {
  const notifyLinkCopied = (success: boolean) => {
    if (success) {
      toast.success("PowerBI Link Copied", {
        ...toastProperties,
      });
    } else {
      toast.error("Unable to Copy PowerBI Link", {
        ...toastProperties,
      });
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(props.value)
      .then(() => {
        notifyLinkCopied(true);
      })
      .catch(() => {
        notifyLinkCopied(false);
      });
  };

  const isDisabled = props.value === "";
  const powerBiIconFilePath = isDisabled
    ? "/Power-BI-Gray.png"
    : "/Power-BI.png";
  const powerBiToolTip = isDisabled
    ? "Link is unavailable"
    : "Copy link to clipboard";

  return (
    <>
      <button
        className={`ml flex items-center rounded px-4 py-2 font-medium shadow-md ${isDisabled
            ? "text-gray cursor-not-allowed bg-gray-300"
            : "bg-[#f6d955] text-black hover:bg-[#f4ce25]"
          }`}
        onClick={handleCopyClick}
        disabled={isDisabled}
        data-tooltip-id="link-na"
        data-tooltip-content= {powerBiToolTip}
      >

        <Image
          src={powerBiIconFilePath}
          width={24}
          height={24}
          alt=""
          className="mr-2"
        />

      </button>
      <Tooltip id="link-na" />
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
