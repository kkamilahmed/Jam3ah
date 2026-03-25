import React from "react";

const LocalInput: React.FC<{
  value: string;
  onCommit: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  readOnly?: boolean;
}> = ({ value, onCommit, type = "text", className, placeholder, min, max, step, readOnly }) => {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => { setLocal(value); }, [value]);
  return (
    <input
      type={type}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => onCommit(e.target.value)}
      placeholder={placeholder}
      className={className}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
    />
  );
};

export default LocalInput;
