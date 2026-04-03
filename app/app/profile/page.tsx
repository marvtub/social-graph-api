"use client";
import { parseApiErrorMessage } from "@/app/lib/errors";
import { insertFakeData } from "@/app/lib/insertFakeData";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { z } from "zod";

const profileDataSchema = z.object({
	email: z.string(),
	name: z.string(),
});

export default function Page() {
	const { data, error, isLoading } = useQuery({
		queryKey: ["profile"],
		queryFn: async () => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/profile`,
				{
					credentials: "include",
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(parseApiErrorMessage(data));
			}

			return profileDataSchema.parse(data);
		},
		retry: false,
	});

	const insertFakeDataMutation = useMutation({
		mutationFn: insertFakeData,
	});

	const triggerInsertFakeData = useCallback(() => {
		insertFakeDataMutation.mutate();
	}, [insertFakeDataMutation]);

	if (error) {
		return (
			<p className="text-white bg-red-500/25 p-2 rounded text-sm mt-4">
				{error.message}
			</p>
		);
	}

	if (isLoading || !data) {
		return <p className="text-sm text-slate-400">Loading...</p>;
	}

	return (
		<div className="w-full h-full flex flex-col items-center">
			<h2 className="font-semibold text-white text-3xl mb-4 text-center">
				Profile
			</h2>
			<p className="text-white text-lg w-full">Name: {data.name}</p>
			<p className="text-white text-lg w-full">Email: {data.email}</p>

			<div className="flex-grow flex flex-col justify-end">
				<div className="bg-slate-700/50 p-4 rounded flex flex-col text-sm w-full">
					<p className="leading-6">
						This dev tool will make several calls to{" "}
						<span className="font-mono bg-slate-600 p-1 text-xs -my-1 rounded">
							/v1/auth/register
						</span>{" "}
						and{" "}
						<span className="font-mono bg-slate-600 p-1 text-xs -my-1 rounded">
							/v1/friends/add
						</span>{" "}
						in order to populate your database with test data.
					</p>
					<button
						onClick={triggerInsertFakeData}
						disabled={insertFakeDataMutation.isPending}
						className="w-full mt-4 p-2 rounded-md bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
						type="button"
					>
						Insert Fake Data
					</button>
				</div>
			</div>
		</div>
	);
}
