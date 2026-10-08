import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type NavItem = {
	to: string;
	label: string;
	icon: LucideIcon;
};

// Icon-only navigation links. Uses React Router <Link> (client-side) so it does
// not trigger `beforeunload` guards.
export function NavLinks({
	items,
	className,
}: {
	items: NavItem[];
	className?: string;
}) {
	return (
		<nav
			aria-label="Page navigation"
			className={cn("flex items-center gap-2", className)}
		>
			{items.map(({ to, label, icon: Icon }) => (
				<Button key={to} asChild variant="outline" size="icon" title={label}>
					<Link to={to} aria-label={label}>
						<Icon className="h-4 w-4" aria-hidden="true" />
					</Link>
				</Button>
			))}
		</nav>
	);
}
