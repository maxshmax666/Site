import { type MouseEvent, useCallback, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cart.store";
import { selectCartCount } from "../../store/cart.selectors";
import { cn } from "../../lib/cn";
import { useAuthStore } from "../../store/auth.store";
import { hasRole, type Role } from "../../lib/roles";
import { scrollToMenuSection } from "../../shared/scrollToMenu";
import { mainNav } from "../../shared/navigation/mainNav";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const count = useCartStore(selectCartCount);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const signOut = useAuthStore((s) => s.signOut);
  const showAdmin = hasRole(role as Role, "engineer"); // engineer+ видят админку

  async function handleSignOut() {
    try {
      await signOut();
      setMobileNavOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Ошибка выхода из аккаунта", error);
    }
  }

  const handleMenuNavigation = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      setMobileNavOpen(false);

      if (location.pathname === "/") {
        event.preventDefault();
        window.history.replaceState(null, "", "/#menu");

        if (!scrollToMenuSection("smooth")) {
          navigate("/#menu");
        }

        return;
      }

      navigate("/#menu");
    },
    [location.pathname, navigate]
  );

  return (
    <header className="sticky top-0 z-[40] backdrop-blur bg-bg/75 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <NavLink to="/" className="font-black tracking-wide text-lg">
          <span className="text-orange">Tagil</span>{" "}
          <span className="text-green">Pizza</span>{" "}
          <span className="text-yellow">🍕</span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {mainNav.map((x) => (
            <NavLink
              key={x.to}
              to={x.to}
              onClick={x.label === "Меню" ? handleMenuNavigation : undefined}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              {x.label}
            </NavLink>
          ))}

          {showAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              Админ
            </NavLink>
          )}
        </nav>

        <button
          type="button"
          className="md:hidden px-3 py-2 rounded-xl text-sm hover:bg-white/5 text-white/85"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav"
        >
          {mobileNavOpen ? "Закрыть" : "Меню"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {user === null ? (
            <NavLink
              to="/login"
              onClick={() => setMobileNavOpen(false)}
              className="px-3 py-2 rounded-xl text-sm hover:bg-white/5 text-white/85"
            >
              Войти
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/profile"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-xl text-sm hover:bg-white/5 text-white/85"
              >
                Профиль
              </NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-2 rounded-xl text-sm hover:bg-white/5 text-white/85"
              >
                Выйти
              </button>
            </>
          )}
          <NavLink
            to="/cart"
            onClick={() => setMobileNavOpen(false)}
            className="relative px-4 py-2 rounded-xl text-sm bg-orange text-black font-semibold hover:opacity-90"
          >
            Корзина
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow text-black text-xs font-black flex items-center justify-center">
                {count}
              </span>
            )}
          </NavLink>
        </div>
      </div>

      {mobileNavOpen && (
        <nav id="mobile-nav" className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {mainNav.map((x) => (
            <NavLink
              key={x.to}
              to={x.to}
              onClick={
                x.label === "Меню"
                  ? handleMenuNavigation
                  : () => setMobileNavOpen(false)
              }
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              {x.label}
            </NavLink>
          ))}

          {showAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              Админ
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}
