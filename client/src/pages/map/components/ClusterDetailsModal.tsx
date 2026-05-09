import { Modal, type ModalRefType } from "@client/components/Modal";
import { H3, P } from "@client/components/typography";
import type { ClientClusterType } from "@client/utils/clusterTypes";
import type { RefObject } from "react";
import { ClusterCard } from "./ClusterCard";

interface ClusterDetailsModalProps {
	modalRef: RefObject<ModalRefType | null>;
	selectedClusterId: string | null;
	clusterList: ClientClusterType[];
}

export const ClusterDetailsModal = ({
	modalRef,
	selectedClusterId,
	clusterList,
}: ClusterDetailsModalProps) => {
	const cluster = selectedClusterId
		? clusterList.find((c) => c.id === selectedClusterId)
		: null;

	return (
		<Modal
			modalRef={modalRef}
			header={
				<div className="flex flex-col">
					<H3 className="text-lg font-bold">Cluster Details</H3>
					<P className="text-xs text-muted">Detected neighborhood event</P>
				</div>
			}
		>
			<div className="p-4">
				{cluster ? (
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
				) : null}
			</div>
		</Modal>
	);
};
