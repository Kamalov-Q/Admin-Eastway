const InlineError = ({ msg }: { msg: string }) =>
  msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null;

export default InlineError;
