"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const paths = {
	"/app/profile": "Profile",
	"/app/friends": "Friends",
};

export default function AppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const path = usePathname();

	const currentPath = Object.keys(paths).find((key) => path.startsWith(key));

	return (
		<div className="w-full h-full flex flex-col items-center justify-center py-8">
			<div className="w-[600px] max-w-full h-full border border-slate-600 rounded-lg p-8 overflow-hidden flex flex-col gap-4">
				<nav className="flex gap-4">
					{Object.entries(paths).map(([key, value]) => (
						<Link key={key} href={key}>
							{key === currentPath ? (
								<span className="text-white font-semibold">{value}</span>
							) : (
								<span className="text-white hover:underline">{value}</span>
							)}
						</Link>
					))}
				</nav>
				<div className="flex flex-col flex-grow w-full h-full overflow-hidden">
					{children}
				</div>
			</div>
		</div>
	);
}
