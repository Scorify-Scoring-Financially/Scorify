"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { IoMailOutline } from "react-icons/io5";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

// VALIDATION SCHEMA
const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // HANDLE LOGIN SUBMIT
  // HANDLE LOGIN SUBMIT
  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || "Login gagal. Coba lagi.");
        return;
      }

      // === CEK ROLE DARI RESPONSE LOGIN ===
      if (result.user?.role === "Admin") {
        router.push("/admin/dashboard");
      } else if (result.user?.role === "Sales") {
        router.push("/dashboard");
      } else {
        // fallback kalau role tidak dikenal
        router.push("/");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("Terjadi kesalahan. Coba lagi.");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4]">

      {/* LEFT SECTION */}
      <div className="hidden lg:flex w-1/2 h-screen px-20 items-center justify-center">
        <div className="flex flex-col space-y-6 max-w-lg -mt-10">
          <Image
            src="/logo-scorify.png"
            alt="Scorify Logo"
            width={170}
            height={50}
            className="mb-2"
          />

          <h1 className="text-4xl font-extrabold text-gray-800 leading-snug">
            Optimalkan Prioritas <br />
            <span className="text-[#00A884]">Nasabah Anda</span>
          </h1>

          <div className="flex justify-start pt-4">
            <Image
              src="/illustration-login.png"
              alt="Ilustrasi Login"
              width={350}
              height={350}
              className="w-[350px] h-auto drop-shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex w-full lg:w-1/2 h-screen justify-center items-center px-10 bg-white">
        <div className="w-full max-w-md p-6 rounded-xl shadow-[0_8px_30px_rgba(0,168,132,0.15)]">

          <h2 className="text-3xl font-extrabold text-gray-800">
            Masuk ke Scorify
          </h2>

          <p className="text-gray-500 text-sm mt-1 mb-8">
            Silakan masuk untuk melanjutkan ke dashboard.
          </p>

          {/* FORM LOGIN */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* EMAIL */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Email</label>

              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Masukkan email"
                  className={`w-full border rounded-lg px-4 py-2 pr-12 outline-none transition
                    ${errors.email
                      ? "border-red-500 focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]"
                      : "border-gray-300 focus:ring-2 focus:ring-[#00A884]"
                    }`}
                />


                <IoMailOutline
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-400"
                />
              </div>

              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  className={`w-full border rounded-lg px-4 py-2 pr-12 outline-none transition appearance-none
                    ${errors.password
                      ? "border-red-500 focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]"
                      : "border-gray-300 focus:ring-2 focus:ring-[#00A884]"
                    }`}
                />

                {/* SHOW / HIDE BUTTON */}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
              </div>

              {/* ERROR MESSAGE */}
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}

              {/* Lupa Password */}
              <p className="text-right mt-1 text-sm">
                <a href="#" className="text-[#00A884] hover:underline">
                  Lupa password?
                </a>
              </p>

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#00A884] text-white py-2 rounded-lg font-semibold hover:bg-[#00956d] disabled:opacity-70 transition shadow-sm"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>

            {serverError && (
              <p className="text-red-500 text-center">{serverError}</p>
            )}
          </form>

          {/* COPYRIGHT */}
          <p className="text-center text-xs text-gray-400 mt-14">
            ©2025 Scorify. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
