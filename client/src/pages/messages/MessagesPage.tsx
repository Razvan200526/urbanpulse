import { useAuth } from "@client/hooks/useAuth";
import { Card, ScrollShadow, Spinner, Table } from "@heroui/react";
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
		<div className="min-h-dvh bg-surface">
			<div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
				<H3>Pending Borrow Requests</H3>

				{isLoading ? (
					<div className="flex justify-center p-8">
						<Spinner size="lg" color="current" />
					</div>
				) : !requests || requests.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-border bg-surface-secondary/30 p-8 text-center text-muted">
						No pending borrow requests right now.
					</div>
				) : (
					<ScrollShadow
						size={10}
						hideScrollBar
						className="max-h-[calc(100dvh-12rem)] rounded-3xl"
					>
						<div className="space-y-3 md:hidden">
							{requests.map((item: PendingRequestItem) => (
								<Card
									key={item.transaction.id}
									className="border border-border shadow-none"
								>
									<Card.Content className="space-y-4 p-4">
										<div className="space-y-1">
											<p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
												Resource
											</p>
											<p className="text-base font-semibold text-foreground">
												{item.resource?.name || "Unknown Resource"}
											</p>
										</div>
										<div className="flex items-center gap-3">
											<Avatar user={item.borrower} />
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-foreground">
													{item.borrower?.name || "Unknown"}
												</p>
												<p className="text-xs text-muted">
													Requested{" "}
													{formatDate(new Date(item.transaction.startAt))}
												</p>
											</div>
										</div>
										<div className="flex flex-col gap-2 sm:flex-row">
											<Button
												size="sm"
												variant="danger-soft"
												className="w-full"
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
												className="w-full"
												onPress={() =>
													handleActionClick(item.transaction.id, "accept")
												}
												startContent={<CheckIcon className="size-4" />}
											>
												Accept
											</Button>
										</div>
									</Card.Content>
								</Card>
							))}
						</div>

						<Table
							aria-label="Borrow requests table"
							className="mt-1 hidden md:block"
						>
							<Table.ScrollContainer>
								<Table.Content>
									<Table.Header>
										<Table.Column>RESOURCE</Table.Column>
										<Table.Column>BORROWER</Table.Column>
										<Table.Column>DATE REQUESTED</Table.Column>
										<Table.Column>ACTIONS</Table.Column>
									</Table.Header>
									<Table.Body>
										{requests.map((item: PendingRequestItem) => (
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
					</ScrollShadow>
				)}
			</div>
			<RespondRequestModal
				modalRef={modalRef}
				transactionId={selectedAction?.id || null}
				action={selectedAction?.action || null}
				onSettled={() => setSelectedAction(null)}
			/>
		</div>
	);
};
