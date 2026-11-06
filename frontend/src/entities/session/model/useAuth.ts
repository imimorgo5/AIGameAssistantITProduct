import { useContext } from "react";

import { AuthContext } from "./AuthContext";
export default function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider отсутствует");

  return value;
}
