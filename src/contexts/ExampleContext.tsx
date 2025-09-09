import React, { createContext, useContext, useState } from "react";

// Example context types
interface ExampleContextProps {
  value: string;
  setValue: (val: string) => void;
  count: number;
  setCount: (val: number) => void;
}

interface ExampleProviderProps {
  children: React.ReactNode;
}

const ExampleContext = createContext<ExampleContextProps>(
  {} as ExampleContextProps
);

// eslint-disable-next-line react-refresh/only-export-components
export const useExample = () => useContext(ExampleContext);

export const ExampleProvider: React.FC<ExampleProviderProps> = ({
  children,
}) => {
  const [value, setValue] = useState("");
  const [count, setCount] = useState(0);

  return (
    <ExampleContext.Provider
      value={{
        value,
        setValue,
        count,
        setCount,
      }}
    >
      {children}
    </ExampleContext.Provider>
  );
};
