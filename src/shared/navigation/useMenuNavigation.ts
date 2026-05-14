import { useCallback, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { scrollToMenuSection } from "../scrollToMenu";
import { routes } from "./mainNav";

type UseMenuNavigationOptions = {
  onNavigateStart?: () => void;
};

export function useMenuNavigation(options?: UseMenuNavigationOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const onNavigateStart = options?.onNavigateStart;

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onNavigateStart?.();

      if (location.pathname === routes.home) {
        event.preventDefault();
        window.history.replaceState(null, "", routes.menuHash);

        if (!scrollToMenuSection("smooth")) {
          navigate(routes.menuHash);
        }

        return;
      }

      navigate(routes.menuHash);
    },
    [location.pathname, navigate, onNavigateStart]
  );
}
