const CustomLabel = ({
  children,
  required,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <label
    className={`${className} text-sm font-medium text-gray-700 mb-1 block`}
  >
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export default CustomLabel;
