// File: src/app/(auth)/login/page.tsx

"use client"; // Wajib untuk halaman interaktif

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdOutlineEmail } from "react-icons/md";
import { LuLockKeyhole } from "react-icons/lu";



const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});


type LoginFormValues = z.infer<typeof loginSchema>;


export default function LoginPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    // 5. Buat fungsi onSubmit
    const onSubmit = async (data: LoginFormValues) => {
        setServerError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setServerError(errorData.error || 'Login failed. Please try again.');
                return;
            }

            // Login Berhasil
            router.push('/dashboard');
            router.refresh();

        } catch (err) {
            console.error(err);
            setServerError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <main className='flex flex-col items-center justify-center min-h-[100vh]'>
            {/* 6. Gunakan handleSubmit dari react-hook-form */}
            <form className='bg-white p-[2rem] rounded-lg shadow-sm w-full max-w-[500px]' onSubmit={handleSubmit(onSubmit)}>
                <div className='flex flex-col gap-5 text-center justify-center items-center mb-6'>
                    <h1 className='font-bold text-[#5B4AD3] text-4xl'>Scorify</h1>
                    <div>
                        <h3 className='font-bold text-2xl'>Selamat Datang Kembali</h3>
                        <p className='text-[#999999] text-sm'>Masuk untuk melanjutkan ke Dashboard anda</p>
                    </div>
                </div>

                <div className='mb-[1rem]'>
                    <label htmlFor="email" className='block mb-[0.5rem]'>Email</label>
                    <div className='relative'>
                        <input
                            id="email"
                            type="email"
                            className={`w-full p-[0.75rem] border-2 border-solid border-[#DFE1E6] rounded-md ${(errors.email ? 'border-red-500' : {})}`}
                            {...register("email")} // 7. Daftarkan input 'email'
                        />
                        <MdOutlineEmail className={`absolute right-0 text-[#d0d0d2] ${errors.email ? ' text-red-500' : ''} top-1/2  -translate-x-1/2 -translate-y-1/2 transform text-2xl `} />
                    </div>
                    {/* 8. Tampilkan pesan error spesifik dari Zod */}
                    {errors.email && (
                        <p className='text-red-500 text-sm mt-[0.25rem]'>{errors.email.message}</p>
                    )}
                </div>

                <div className='mb-[1rem]'>
                    <label htmlFor="password" className='block mb-[0.5rem]'>Password</label>
                    <div className="relative">
                        <input
                            id="password"
                            type="password"
                            className={`w-full p-[0.75rem] border-2 border-solid border-[#DFE1E6] rounded-md ${(errors.password ? 'border-red-500' : {})}`}
                            {...register("password")} // 7. Daftarkan input 'password'
                        />
                        <LuLockKeyhole className={`absolute right-0 text-[#d0d0d2] ${errors.password ? 'text-red-500' : ''} top-1/2  -translate-x-1/2 -translate-y-1/2 transform text-2xl`} />
                    </div>
                    {/* 8. Tampilkan pesan error spesifik dari Zod */}
                    {errors.password && (
                        <p className='text-red-500 text-sm mt-[0.25rem]'>{errors.password.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    className='w-full p-[0.75rem] border-none rounded-md bg-[#FF8E72] text-white mt-3 text-[1rem] font-bold cursor-pointer'
                    disabled={isSubmitting} // Tombol otomatis disable saat submit
                >
                    {isSubmitting ? 'Logging in...' : 'Masuk'}
                </button>

                {/* Tampilkan error dari server (bukan dari Zod) */}
                {serverError && (
                    <p className='text-red-500 mt-[1rem] text-center'>
                        {serverError}
                    </p>
                )}

                <p className='text-center mt-6'>
                    <Link href="/register" className='text-blue-600'>
                        Lupa password?
                    </Link>
                </p>
            </form>
        </main>
    );
}