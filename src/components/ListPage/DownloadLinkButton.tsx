import type { CustomCellRendererProps } from 'ag-grid-react';
import Image from 'next/image';
import { Bounce, toast } from 'react-toastify';
import type { ToastPosition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const toastProperties = {
  position: 'bottom-right' as ToastPosition,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
};

interface DownloadLinkButtonProps {
  jobId: string;
  s3Link: string;
  isDisabled: boolean;
}

export default function DownloadLinkButton(props: DownloadLinkButtonProps) {
  const getFileLink = () => {
    return `${props}metadata/${props.jobId}/${props.jobId}-data.parquet`;
  };

  const isDisabled = props.isDisabled;

  const powerBiIconFilePath = isDisabled
    ? '/Apache_Parquet_logo.svg.grey.png'
    : '/Apache_Parquet_logo.svg.png';

  return (
    <div className='py-1'>
      <a
        className={`ml x-3 flex items-center justify-center rounded py-2 font-medium shadow-md focus:outline-none ${
          isDisabled
            ? 'text-gray cursor-not-allowed bg-gray-300 '
            : 'bg-[#4ca8f1] text-black'
        }`}
        href={getFileLink()}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }

          toast.success('Downloaded file', {
            ...toastProperties,
          });
        }}
      >
        <Image
          src={powerBiIconFilePath}
          width={38}
          height={38}
          alt=''
        />
      </a>
    </div>
  );
}
