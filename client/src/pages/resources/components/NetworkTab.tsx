import { Button } from "@client/components/Button/Button";
import { InputSearch } from "@client/components/input/InputSearch";
import { H6 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { useFilterResources } from "@client/pages/resources/hooks";
import type { ClientUserType } from "@client/utils/types";
import { Card, Chip } from "@heroui/react";
import { MapPin, Users } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router";

type NetworkMember = {
	author: ClientUserType;
	offeredResources: string[];
};

const MemberCard = ({ member }: { member: NetworkMember }) => {
	const navigate = useNavigate();

	return (
		<Card className="border border-border-secondary shadow-none hover:border-accent transition-colors duration-150">
			<Card.Header className="flex flex-row items-center gap-3">
				<Avatar user={member.author} />
				<div className="flex flex-col gap-0.5 min-w-0">
					<H6 className="truncate">{member.author.name}</H6>
					<span className="flex items-center gap-1 text-xs text-muted">
						<MapPin className="size-3 shrink-0" />
						{member.author.bio?.trim() || "UrbanPulse neighbour"}
					</span>
				</div>
			</Card.Header>

			<Card.Content className="space-y-3">
				<div className="flex flex-wrap gap-1.5">
					{member.offeredResources.slice(0, 3).map((resource) => (
						<Chip key={resource} variant="soft" color="accent" size="sm">
							<Chip.Label>{resource}</Chip.Label>
						</Chip>
					))}
					{member.offeredResources.length > 3 && (
						<Chip variant="soft" color="default" size="sm">
							<Chip.Label>
								+{member.offeredResources.length - 3} more
							</Chip.Label>
						</Chip>
					)}
				</div>
				<p className="text-xs text-muted">
					{member.offeredResources.length} community offer
					{member.offeredResources.length === 1 ? "" : "s"} available
					{member.author.trustScore != null
						? ` · Trust ${Math.round(member.author.trustScore)}`
						: ""}
				</p>
			</Card.Content>

			<Card.Footer className="pt-0">
				<Button
					variant="primary"
					size="sm"
					className="w-full"
					onPress={() => navigate("/resources?tab=resources")}
				>
					Browse offers
				</Button>
			</Card.Footer>
		</Card>
	);
};

export const NetworkTab = () => {
	const { data: resources, isLoading } = useFilterResources("All");
	const [searchTerm, setSearchTerm] = useState("");
	const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

	const members = useMemo(() => {
		const byAuthor = new Map<string, NetworkMember>();

		for (const item of resources ?? []) {
			if (!item.author?.id) continue;

			const existing = byAuthor.get(item.author.id);
			if (existing) {
				existing.offeredResources.push(item.resource.name);
				continue;
			}

			byAuthor.set(item.author.id, {
				author: item.author,
				offeredResources: [item.resource.name],
			});
		}

		return Array.from(byAuthor.values()).sort(
			(a, b) => b.offeredResources.length - a.offeredResources.length,
		);
	}, [resources]);

	const filteredMembers = useMemo(() => {
		if (!deferredSearchTerm) {
			return members;
		}

		return members.filter((member) => {
			const haystack = [
				member.author.name,
				member.author.bio || "",
				...member.offeredResources,
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(deferredSearchTerm);
		});
	}, [deferredSearchTerm, members]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-foreground">
						People sharing in your network
					</p>
					<p className="text-xs text-muted">
						{filteredMembers.length} neighbours currently offering skills or
						resources
					</p>
				</div>
				<InputSearch
					className="w-full max-w-sm"
					placeholder="Search people or offers..."
					onChange={(value) => setSearchTerm(String(value))}
				/>
			</div>

			{isLoading ? (
				<div className="text-sm text-muted">Loading community network…</div>
			) : filteredMembers.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{filteredMembers.map((member) => (
						<MemberCard key={member.author.id} member={member} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-10 gap-3">
					<div className="flex items-center gap-2 text-muted">
						<Users className="size-4" />
						<span className="text-sm">
							No matching neighbours found in the shared library yet.
						</span>
					</div>
				</div>
			)}
		</div>
	);
};
