import { AppDrawer } from "@client/components/AppDrawer";
import type { ClientClusterType } from "@client/utils/clusterTypes";
import { Drawer } from "@heroui/react";
import { ClusterCard } from "./ClusterCard";
import { Button } from "@client/components/Button/Button";
import { H3, P } from "@client/components/typography";

interface ClusterDrawerProps {
	cluster: ClientClusterType;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ClusterDrawer({
	cluster,
	isOpen,
	onOpenChange,
}: ClusterDrawerProps) {
	return (
		<AppDrawer
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			backdrop="blur"
			trigger={<div />}
			header={
				<div className="flex flex-col px-4 pt-6 md:px-5">
					<H3 className="text-lg font-bold">Cluster Details</H3>
					<P className="text-xs text-muted">Detected neighborhood event</P>
				</div>
			}
			footer={
				<Drawer.Footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-5">
					<div className="flex justify-end w-full">
						<Button onPress={() => onOpenChange(false)}>Close</Button>
					</div>
				</Drawer.Footer>
			}
			dialogClassName="w-full md:w-[min(32rem,100vw)] border-accent"
			bodyClassName="min-h-0 flex-1 overflow-y-auto p-4"
		>
			<ClusterCard
				id={cluster.id}
				title={`${cluster.pulseType} Cluster`}
				pulseType={cluster.pulseType}
				reports={cluster.reportCount ?? 0}
				confidence={cluster.confidenceScore ?? 0}
				radius={`${cluster.radiusMeters}m`}
				isCrisis={cluster.status === "crisis"}
				status={cluster.status}
			/>
			<li className="mt-6 space-y-4">
				<p className="text-sm text-accent font-semibold">
					Multiple nearby reports indicate a possible emergency. Open the
					cluster to review incidents, confirm severity, and take response
					action.
				</p>
			</li>
		</AppDrawer>
	);
}
