import Image from 'next/image';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface PowerBIButtonProps {
  link: string;
  status: string;
}

const toastProperties = {
  osition: 'bottom-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
};

export default function PowerBIButton({ link, status }: PowerBIButtonProps) {
  const notifyLinkCopied = (success: boolean) => {
    if (success) {
      toast.success('PowerBI Link Copied', {
        ...toastProperties,
      });
    } else {
      toast.error('Unable to Copy PowerBI Link', {
        ...toastProperties,
      });
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        notifyLinkCopied(true);
      })
      .catch(() => {
        notifyLinkCopied(false);
      });
  };

  const isDisabled = status !== 'Complete';
  const powerBiIconFilePath = isDisabled
    ? '/Power-BI-Gray.png'
    : '/Power-BI.png';

  return (
    <>
      <button
        className={`ml flex items-center rounded px-4 py-2 font-medium shadow-md ${
          isDisabled
            ? 'text-gray cursor-not-allowed bg-gray-300'
            : 'bg-[#f6d955] text-black hover:bg-[#f4ce25]'
        }`}
        onClick={handleCopyClick}
        disabled={isDisabled}
      >
        <Image
          src={powerBiIconFilePath}
          width={24}
          height={24}
          alt=''
          className='mr-2'
        />
        Copy PowerBI Link
      </button>
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='light'
      />
    </>
  );
}
