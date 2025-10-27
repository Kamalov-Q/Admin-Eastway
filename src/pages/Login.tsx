"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import axiosInstance from "@/api/axios";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

interface LoginForm {
  phoneNumber: string;
  password: string;
}

export default function LoginPage() {
  const { login, setUser } = useAuthStore();
  const { register, handleSubmit } = useForm<LoginForm>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: LoginForm) =>
      axiosInstance.post("/auth/login", data).then((r) => r.data),
    onSuccess: (data) => {
      const token = data.access_token || data.token;
      const { phoneNumber, role } = data;
      setUser({ phoneNumber, role });

      if (!token) {
        toast.error("No token received from server");
        return;
      }

      login(token);
      toast.success("Login successful!", { duration: 1200 });

      sessionStorage.setItem("eastway_show_welcome", "1");

      navigate("/", { replace: true });
    },
    onError: (err: any) => {
      console.error("Login error:", err?.response?.data);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Login failed",
        { duration: 2000 }
      );
    },
  });

  const onSubmit = (data: LoginForm) => mutation.mutate(data);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-linear-to-tr from-indigo-600 via-blue-500 to-purple-500 overflow-hidden">
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
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password", { required: true })}
              className="border rounded-md px-3 py-2 w-full pr-10 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
