"use client";

import { parseApiErrorMessage } from "@/app/lib/errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { z } from "zod";

const friendListSchema = z.array(
	z.object({
		name: z.string(),
		email: z.string(),
		degree: z.enum(["1st", "2nd", "3rd"]),
	})
);

export default function Page() {
	const { data, error, isLoading } = useQuery({
		queryKey: ["friends"],
		queryFn: async () => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/friends`,
				{
					credentials: "include",
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(parseApiErrorMessage(data));
			}

			return friendListSchema.parse(data);
		},
		retry: false,
	});


    const summary = useMemo(() => ({
        friends: data?.reduce((acc, friend) => acc + (friend.degree === "1st" ? 1 : 0), 0),
        secondDegreeFriends: data?.reduce((acc, friend) => acc + (friend.degree === "2nd" ? 1 : 0), 0),
        thirdDegreeFriends: data?.reduce((acc, friend) => acc + (friend.degree === "3rd" ? 1 : 0), 0),
    }), [data])

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
		<div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex gap-2 text-sm font-medium">
                <p className="text-white">Friends: {summary.friends}</p>
                <p className="text-white">2nd Degree Friends: {summary.secondDegreeFriends}</p>
                <p className="text-white">3rd Degree Friends: {summary.thirdDegreeFriends}</p>
            </div>
            <div className="h-full flex flex-col w-full items-center overflow-auto">
                {data.map((friend) => (
                    <Friend key={friend.email} {...friend} />
                ))}
            </div>
		</div>
	);
}

function Friend({
	name,
	degree,
	email,
}: z.infer<typeof friendListSchema>[number]) {
	const queryClient = useQueryClient();

	const addFriendMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/friends/add`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({ friendEmail: email }),
				}
			);

			if (!response.ok) {
				throw new Error(parseApiErrorMessage(await response.json()));
			}
		},
		onSuccess() {
			queryClient.invalidateQueries({ queryKey: ["friends"] });
		},
	});

	const addFriend = useCallback(() => {
		addFriendMutation.mutate();
	}, [addFriendMutation]);

	return (
		<div className="flex items-center justify-between w-full p-4 border-b border-slate-600">
			<p className="text-white">{name}</p>
			<div className="flex items-center gap-2">
				<p className="text-white">{degree}</p>
				{degree !== "1st" && (
					<button
						onClick={addFriend}
						className="bg-blue-600 text-white p-2 rounded-md text-xs disabled:opacity-50 hover:opacity-90"
					>
						Add Friend
					</button>
				)}
			</div>
		</div>
	);
}
