// src/App.jsx — Root router: Login → Admin dashboard OR User storefront
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginPage  from "./pages/LoginPage";
import AdminApp   from "./AdminApp";
import StoreFront from "./store/StoreFront";

function Router() {
  const { user } = useAuth();

  if (!user)                  return <LoginPage />;
  if (user.role === "admin")  return <AdminApp />;
  return <StoreFront />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
