import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function RootLayout() {
  const location = useLocation();
  const isShowcaseHome = location.pathname === "/";

  return (
    <div className="min-h-full flex flex-col">
      {!isShowcaseHome ? <Header /> : null}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isShowcaseHome ? <Footer /> : null}
    </div>
  );
}
