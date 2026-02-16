import { Navigate, useLocation } from "react-router-dom";

/**
 * Redirects from / to /step-1 while PRESERVING all query params (UTMs, fbclid, etc.)
 * Critical: without this, ad traffic landing on / loses their UTM params.
 */
const RedirectWithParams = () => {
  const location = useLocation();
  return <Navigate to={`/step-1${location.search}${location.hash}`} replace />;
};

export default RedirectWithParams;
