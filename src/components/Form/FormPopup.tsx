import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/router";

interface FormPopupProps {
  formSuccess: boolean;
  showPopup: boolean;
  setShowPopup: Dispatch<SetStateAction<boolean>>;
}

export default function FormPopup({
  formSuccess,
  showPopup,
  setShowPopup,
}: FormPopupProps) {
  const router = useRouter();
  return (
    <>
      {showPopup ? (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
            <div className="relative mx-auto my-6 w-auto max-w-3xl">
              {/*content*/}

              <div className="relative flex w-full flex-col items-center rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none">
                {/*
                  Success SVG Source: https://fontawesome.com/icons/circle-check?f=classic&s=solid
                  Failure SVG Source: https://fontawesome.com/icons/circle-xmark?f=classic&s=solid
                  Show a green checkmark svg for a successful form submission, and a red x elsewise. 
                */}
                {formSuccess ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="50"
                    width="50"
                    viewBox="0 0 512 512"
                    className="mt-4"
                  >
                    <path
                      d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
                      fill="rgba(54, 180, 114, 0.9)"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="50"
                    width="50"
                    viewBox="0 0 512 512"
                    className="mt-4"
                  >
                    <path
                      d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"
                      fill="rgba(239, 54, 54, 0.9)"
                    />
                  </svg>
                )}
                {/*header*/}
                <div className="flex rounded-t pt-5">
                  <h3 className="text-2xl font-semibold">
                    {formSuccess
                      ? "Use Case Successfully Submitted"
                      : "Use Case Submission Failed"}
                  </h3>
                </div>
                {/*body*/}
                <div className="relative flex-auto pl-5 pr-5">
                  <p className="text-blueGray-500 my-4 text-lg leading-relaxed">
                    {formSuccess
                      ? "Use Case has successfully been submitted. Processing will begin shortly."
                      : "Error has occured. Please contact an administrator."}
                  </p>
                </div>
                {/*footer*/}
                <div className="border-blueGray-200 flex items-center justify-end rounded-b pb-6">
                  <button
                    className="background-transparent mb-1 mr-1 px-6 py-2 text-sm font-bold uppercase outline-none transition-all duration-150 ease-linear focus:outline-none"
                    type="button"
                    onClick={() => {
                      setShowPopup(false);
                      // For successful form submissions, clear the form once the user has closed the popup.
                      const form = document.getElementById(
                        "useSubmissionCaseForm",
                      ) as HTMLFormElement;
                      if (formSuccess && form) {
                        form.submit();
                      }
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="mb-1 mr-1 rounded bg-blue px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-emerald-600"
                    type="button"
                    onClick={() => {
                      setShowPopup(false);
                      void router.push("/ListPage");
                    }}
                  >
                    View Use Cases
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-50"></div>
        </>
      ) : null}
    </>
  );
}
