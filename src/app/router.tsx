import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./layout/RootLayout";
import { HomePage } from "../pages/HomePage";
import { MenuPage } from "../pages/MenuPage";
import { MenuCategoryPage } from "../pages/MenuCategoryPage";
import { PizzaPage } from "../pages/PizzaPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrderSuccessPage } from "../pages/OrderSuccessPage";
import { LoginPage } from "../pages/LoginPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { ProfilePage } from "../pages/ProfilePage";
import { CateringPage } from "../pages/CateringPage";
import { ContactsPage } from "../pages/ContactsPage";
import { LoyaltyPage } from "../pages/LoyaltyPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AuthGate } from "../components/AuthGate";

import { AdminGate } from "../components/admin/AdminGate";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminKitchenPage } from "../pages/admin/AdminKitchenPage";
import { AdminCouriersPage } from "../pages/admin/AdminCouriersPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminMenuPage } from "../pages/admin/AdminMenuPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "menu/:category", element: <MenuCategoryPage /> },
      { path: "pizza/:id", element: <PizzaPage /> },
      { path: "cart", element: <CartPage /> },
      {
        path: "checkout",
        element: (
          <AuthGate>
            <CheckoutPage />
          </AuthGate>
        ),
      },
      {
        path: "order/success/:id",
        element: (
          <AuthGate>
            <OrderSuccessPage />
          </AuthGate>
        ),
      },
      { path: "login", element: <LoginPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      {
        path: "profile",
        element: (
          <AuthGate>
            <ProfilePage />
          </AuthGate>
        ),
      },
      { path: "catering", element: <CateringPage /> },
      { path: "contacts", element: <ContactsPage /> },
      { path: "loyalty", element: <LoyaltyPage /> },

      // ADMIN (мин. роль engineer+)
      {
        path: "admin",
        element: (
          <AdminGate minRole="engineer">
            <AdminLayout />
          </AdminGate>
        ),
        children: [
          { index: true, element: <AdminOrdersPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
          { path: "kitchen", element: <AdminKitchenPage /> },
          { path: "couriers", element: <AdminCouriersPage /> },
          { path: "menu", element: <AdminMenuPage /> },
          { path: "users", element: <AdminUsersPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
