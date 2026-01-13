import { createContext, ReactNode, useContext } from "react";

interface LStorageContext {}
export const LStorageContext = createContext<LStorageContext>(
  {} as LStorageContext
);

export function LStorageContextProvider({ children }: { children: ReactNode }) {
  return (
    <LStorageContext.Provider value={{}}>{children}</LStorageContext.Provider>
  );
}

export default function useLocal() {
  const context = useContext(LStorageContext);
  if (!context) throw new Error("Context called outside of the provider!");
  return context;
}
