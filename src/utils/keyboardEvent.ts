export const isKeyboardEvent = (
  e:
    | React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
    | React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>
): e is React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement> => {
  return (
    (e as React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>).key !==
    undefined
  );
};
