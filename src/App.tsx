import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import type { JSX } from "react";
import { useAuthStore } from "./store/auth-store";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CountriesPage from "./pages/Countries";
import CitiesPage from "./pages/Cities";
import ToursPage from "./pages/Tours";
import HotelsPage from "./pages/Hotels";
import NotFoundPage from "./pages/NotFound";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function LoginRoute() {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route path="countries" element={<CountriesPage />} />
            <Route path="cities" element={<CitiesPage />} />
            <Route path="tours" element={<ToursPage />} />
            <Route path="hotels" element={<HotelsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
