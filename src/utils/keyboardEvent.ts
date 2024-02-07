export const isKeyboardEvent = (
  e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>,
): e is React.KeyboardEvent<HTMLInputElement> => {
  return (e as React.KeyboardEvent<HTMLInputElement>).key !== undefined;
};
