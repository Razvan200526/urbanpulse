import { useAuth } from "@client/hooks/useAuth";
import { Spinner, Table } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { CheckIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../components/Button/Button";
import type { ModalRefType } from "../../components/Modal";
import { H3 } from "../../components/typography";
import { Avatar } from "../../components/user/Avatar";
import { useGetPendingRequests } from "../resources/hooks";
import type { PendingRequestItem } from "../resources/resourceResponses";
import { RespondRequestModal } from "./components/RespondRequestModal";

export const MessagesPage = () => {
	const { data: user } = useAuth();
	const { data: requests, isLoading } = useGetPendingRequests(
		user?.user.id || "",
	);

	const modalRef = useRef<ModalRefType>(null);
	const [selectedAction, setSelectedAction] = useState<{
		id: string;
		action: "accept" | "reject";
	} | null>(null);

	const handleActionClick = (id: string, action: "accept" | "reject") => {
		setSelectedAction({ id, action });
		modalRef.current?.open();
	};

	return (
		<div className="p-8 max-w-5xl mx-auto space-y-6">
			<H3>Pending Borrow Requests</H3>

			{isLoading ? (
				<div className="flex justify-center p-8">
					<Spinner size="lg" color="current" />
				</div>
			) : !requests || requests.length === 0 ? (
				<div className="text-center p-8 text-muted">
					No pending borrow requests right now.
				</div>
			) : (
				<Table aria-label="Borrow requests table" className="mt-4">
					<Table.ScrollContainer>
						<Table.Content>
							<Table.Header>
								<Table.Column>RESOURCE</Table.Column>
								<Table.Column>BORROWER</Table.Column>
								<Table.Column>DATE REQUESTED</Table.Column>
								<Table.Column>ACTIONS</Table.Column>
							</Table.Header>
							<Table.Body>
								{requests?.map((item: PendingRequestItem) => (
									<Table.Row key={item.transaction.id}>
										<Table.Cell>
											<div className="font-medium">
												{item.resource?.name || "Unknown Resource"}
											</div>
										</Table.Cell>
										<Table.Cell>
											<div className="flex items-center gap-2">
												<Avatar user={item.borrower} />
												<span className="text-sm">
													{item.borrower?.name || "Unknown"}
												</span>
											</div>
										</Table.Cell>
										<Table.Cell>
											<span className="text-sm text-foreground/70">
												{formatDate(new Date(item.transaction.startAt))}
											</span>
										</Table.Cell>
										<Table.Cell>
											<div className="flex justify-end gap-2">
												<Button
													size="sm"
													variant="danger-soft"
													onPress={() =>
														handleActionClick(item.transaction.id, "reject")
													}
													startContent={<XIcon className="size-4" />}
												>
													Reject
												</Button>
												<Button
													size="sm"
													variant="primary"
													onPress={() =>
														handleActionClick(item.transaction.id, "accept")
													}
													startContent={<CheckIcon className="size-4" />}
												>
													Accept
												</Button>
											</div>
										</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			)}
			<RespondRequestModal
				modalRef={modalRef}
				transactionId={selectedAction?.id || null}
				action={selectedAction?.action || null}
				onSettled={() => setSelectedAction(null)}
			/>
		</div>
	);
};
