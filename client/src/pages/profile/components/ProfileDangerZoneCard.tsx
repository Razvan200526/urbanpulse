import { Button } from "@client/components/Button/Button";
import { useDeleteAccount } from "@client/hooks/useProfileSettings";
import { AlertDialog, Card, Toast } from "@heroui/react";
import { usePostHog } from "@posthog/react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

export const ProfileDangerZoneCard = () => {
	const posthog = usePostHog();
	const navigate = useNavigate();
	const { mutateAsync: deleteAccount, isPending: isDeletingAccount } =
		useDeleteAccount();

	const handleDeleteAccount = async () => {
		try {
			await deleteAccount();
			posthog?.capture("account_deleted");
			posthog?.reset();
			Toast.toast.success("Account deleted");
			navigate("/", { replace: true });
			return true;
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to delete account",
			);
			return false;
		}
	};

	return (
		<Card className="border border-danger/30 shadow-none">
			<Card.Header className="flex flex-col items-start gap-1">
				<Card.Title>Delete account</Card.Title>
				<Card.Description>
					Remove your profile and the personal data attached to this account.
				</Card.Description>
			</Card.Header>
			<Card.Content className="flex flex-col gap-4 border-t border-border px-6 py-5 md:flex-row md:items-center md:justify-between">
				<p className="max-w-3xl text-sm text-muted">
					This permanently deletes your UrbanPulse account, profile data, and
					any dependent records tied to your identity. This action cannot be
					undone.
				</p>
				<AlertDialog>
					<Button
						variant="danger"
						className="w-full sm:w-auto"
						startContent={<Trash2 className="size-4" />}
					>
						Delete account
					</Button>
					<AlertDialog.Backdrop isDismissable={false} isKeyboardDismissDisabled>
						<AlertDialog.Container placement="center" size="sm">
							<AlertDialog.Dialog className="mx-4 w-full max-w-md rounded border border-danger-soft-hover bg-surface">
								{(dialog) => (
									<>
										<AlertDialog.Header className="items-start border-b border-border px-5 py-4">
											<AlertDialog.Icon status="danger" />
											<AlertDialog.Heading>
												Delete your account?
											</AlertDialog.Heading>
										</AlertDialog.Header>
										<AlertDialog.Body className="px-5 py-4 text-sm text-muted">
											<p>
												Deleting your account removes your profile, skills, and
												account-linked activity from UrbanPulse. If you
												continue, your data cannot be restored.
											</p>
										</AlertDialog.Body>
										<AlertDialog.Footer className="border-t border-border px-5 py-4">
											<Button variant="tertiary" onPress={() => dialog.close()}>
												Keep account
											</Button>
											<Button
												variant="danger"
												onPress={async () => {
													const deleted = await handleDeleteAccount();
													if (deleted) {
														dialog.close();
													}
												}}
												isPending={isDeletingAccount}
											>
												Delete my data
											</Button>
										</AlertDialog.Footer>
									</>
								)}
							</AlertDialog.Dialog>
						</AlertDialog.Container>
					</AlertDialog.Backdrop>
				</AlertDialog>
			</Card.Content>
		</Card>
	);
};
