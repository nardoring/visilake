import { CustomCellRendererProps } from "ag-grid-react";
import Image from "next/image";
import { useState } from "react";
import { Bounce, ToastPosition, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastProperties = {
  position: "bottom-right" as ToastPosition,
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

  const isDisabled = props.data.useCaseStatus !== "Complete";
  const powerBiIconFilePath = isDisabled
    ? "/Power-BI-Gray.png"
    : "/Power-BI.png";

  return (
    <>
      <button
        className={`ml flex items-center rounded px-4 py-2 font-medium shadow-md ${isDisabled
            ? "text-gray cursor-not-allowed bg-gray-300"
            : "bg-[#f6d955] text-black hover:bg-[#f4ce25]"
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

      </button>
    </>
  );
}
