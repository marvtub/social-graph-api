import { faker } from "@faker-js/faker";

export async function insertFakeData() {
	const users = Array.from({ length: 100 }).map((_, i) => ({
		email: faker.internet.email(),
		name: faker.person.fullName(),
		password: faker.internet.password(),
	}));

	const userResponse = await fetch(
		`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/profile`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		}
	);

	const mainUser = (await userResponse.json()) as {
		id: string;
		email: string;
		name: string;
	};

	for (const user of users) {
		await fetch(`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/auth/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(user),
			credentials: "include",
		});
	}

	const friendEdges = users.map((user) => {
		const friends = users
			.filter(() => Math.random() > 0.95)
			.map((friend) => friend.email);

		return {
			user,
			friends,
		};
	});

	friendEdges
		.slice(0, 5)
		.forEach(({ friends }) => friends.push(mainUser.email));

	for (const { user, friends } of friendEdges) {
		await fetch(`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email: user.email, password: user.password }),
			credentials: "include",
		});

		for (const friendEmail of friends) {
			await fetch(`${process.env.NEXT_PUBLIC_API_ORIGIN}/v1/friends/add`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ friendEmail }),
				credentials: "include",
			});
		}
	}

	document.location = "/";
}
