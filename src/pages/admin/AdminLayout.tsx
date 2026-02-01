import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";

const tabs = [
  { to: "/admin/orders", label: "Заказы" },
  { to: "/admin/kitchen", label: "Кухня" },
  { to: "/admin/couriers", label: "Курьеры" },
  { to: "/admin/menu", label: "Меню" },
  { to: "/admin/users", label: "Пользователи" },
];

export function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Админ</h1>
          <div className="text-white/70 mt-1">
            Заказы, статусы, кухня, курьеры. Роли: admin / manager / courier / engineer.
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-card border border-white/10 shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
