import { Navigate, useLocation } from "react-router-dom";

import useAuth from "../model/useAuth";

import type { ReactNode } from "react";
export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate
      to="/login"
      state={{
        from: location,
      }}
      replace
    />
  );
}
