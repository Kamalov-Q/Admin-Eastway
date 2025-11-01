import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WelcomeSplash from "@/components/ui/welcome-splash";

import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/store/auth-store";

type UserRole = "admin" | "superadmin";

interface LoginForm {
  phoneNumber: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  role: UserRole;
  phoneNumber: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<LoginForm>();
  const [showPassword, setShowPassword] = useState(false);

  const { setUser } = useAuthStore();

  const fromReauth = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const byQuery = params.get("expired") === "1";
    const byFlag = sessionStorage.getItem("eastway_expired") === "1";
    if (byFlag) sessionStorage.removeItem("eastway_expired");
    return byQuery || byFlag;
  }, []);

  const [successSplash, setSuccessSplash] = useState(false);
  const [errorSplash, setErrorSplash] = useState(false);

  const mutation = useMutation<AuthResponse, any, LoginForm>({
    mutationFn: (payload: LoginForm) =>
      axiosInstance.post("/auth/login", payload).then((r) => r.data),

    onSuccess: (data) => {
      const { access_token, refresh_token, phoneNumber, role } = data;

      if (!access_token) {
        toast.error("No access token received from server");
        return;
      }

      setUser({ phoneNumber, role });

      useAuthStore.getState().login({
        access_token,
        refresh_token,
        user: { phoneNumber, role },
      });

      toast.success("Login successful!", { duration: 800 });

      // small UX candy for your success screen
      sessionStorage.setItem("eastway_show_welcome", "1");
      setSuccessSplash(true);
    },

    onError: (err: any) => {
      console.error("Login error:", err?.response?.data);
      setErrorSplash(true);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid phone or password",
        { duration: 1200 }
      );
    },
  });

  const onSubmit = (form: LoginForm) => mutation.mutate(form);
  const uiDisabled = mutation.isPending || successSplash || errorSplash;

  return (
    <>
      {successSplash && (
        <WelcomeSplash
          open
          variant="success"
          duration={2000}
          message={
            fromReauth
              ? "Welcome back to Admin Dashboard, BOSS!"
              : "Access granted"
          }
          product={
            fromReauth
              ? "Re-authenticated successfully"
              : "Initializing dashboard"
          }
          lines={
            fromReauth
              ? [
                  "> session restored",
                  "> loading admin modules…",
                  "> applying your preferences…",
                  "> launching dashboard",
                ]
              : [
                  "> credentials verified",
                  "> generating session keys…",
                  "> fetching profile…",
                  "> redirecting to dashboard",
                ]
          }
          onClose={() => navigate("/", { replace: true })}
        />
      )}

      {errorSplash && (
        <WelcomeSplash
          open
          variant="error"
          duration={1400}
          message="Access denied"
          product="Authentication failed"
          lines={[
            "> validating credentials…",
            "> access denied!",
            "> you are not able to access the dashboard",
          ]}
          onClose={() => setErrorSplash(false)}
        />
      )}

      <div
        className={`relative flex min-h-screen items-center justify-center bg-linear-to-tr from-indigo-600 via-blue-500 to-purple-500 overflow-hidden ${
          uiDisabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="absolute -top-28 -left-28 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-16 w-80 h-80 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 w-80 sm:w-96">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Login to your account
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-4 sm:space-y-5"
          >
            <Input
              type="tel"
              placeholder="Phone Number"
              {...register("phoneNumber", { required: true })}
              className="border rounded-md px-3 py-2 w-full shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              disabled={uiDisabled}
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", { required: true })}
                className="border rounded-md px-3 py-2 w-full pr-10 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                disabled={uiDisabled}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={uiDisabled}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
              disabled={uiDisabled}
            >
              {mutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
