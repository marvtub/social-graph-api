"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query"
import { z } from "zod";
import { redirect, useRouter } from "next/navigation";
import { parseApiErrorMessage } from "../lib/errors";
import Link from "next/link";

export default function Page() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    const { mutate, error, isPending } = useMutation({
        async mutationFn({ email, password }: { email: string, password: string }) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            })

            if (!response.ok) {
                throw new Error(parseApiErrorMessage(await response.json()))
            }
        },
        onSuccess() {
            router.push('/app')
        }
    })

    const register = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        mutate({ email, password })
    }, [mutate, email, password])

	return (
		<div className="w-full h-full flex flex-col items-center justify-center">
			<form className="w-xl max-w-full border border-slate-600 rounded-lg p-8">
				<h2 className="font-semibold text-white text-3xl mb-4 text-center">Sign in</h2>
                <input className="w-full mt-4 p-2 rounded-md bg-slate-800 text-white" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="w-full mt-4 p-2 rounded-md bg-slate-800 text-white" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {error && <p className="text-white bg-red-500/25 p-2 rounded text-sm mt-4">{error.message}</p>}
                <button onClick={register} disabled={isPending} className="w-full mt-8 p-2 rounded-md bg-blue-600 text-white hover:opacity-90 disabled:opacity-50" type="button">Sign In</button>
                <Link href="/register" className="hover:underline text-slate-400 text-center block mt-4">Register</Link>
			</form>
		</div>
	);
}
