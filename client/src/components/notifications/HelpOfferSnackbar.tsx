import { Button } from "@client/components/Button/Button";
import { useAcceptHelpOffer } from "@client/pages/map/hooks";
import { useHelpOfferUiStore } from "@client/stores/helpOfferUiStore";
import { Toast } from "@heroui/react";
import { HandHeart, X } from "lucide-react";

/**
 * Toast-style bar when someone offers help on your pulse (driven by WebSocket + store).
 */
export function HelpOfferSnackbar() {
	const pending = useHelpOfferUiStore((s) => s.pending);
	const dismiss = useHelpOfferUiStore((s) => s.dismiss);
	const acceptMutation = useAcceptHelpOffer();

	if (!pending) return null;

	const onAccept = () => {
		acceptMutation.mutate(
			{ pulseId: pending.pulseId, responseId: pending.responseId },
			{
				onSuccess: () => {
					Toast.toast.success("Help offer accepted");
					dismiss();
				},
				onError: (err) =>
					Toast.toast.danger(
						err instanceof Error ? err.message : "Could not accept",
					),
			},
		);
	};

	return (
		<div
			className="fixed bottom-6 left-1/2 z-200 flex w-[min(100%-2rem,28rem)] -translate-x-1/2 flex-col gap-3 rounded border border-border bg-surface px-4 py-3 md:flex-row md:items-center md:justify-between"
			role="status"
		>
			<div className="flex gap-3 min-w-0">
				<div className="shrink-0">
					<HandHeart className="size-4 text-accent" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-semibold text-foreground">Help offered</p>
					<p className="text-xs text-muted leading-snug line-clamp-3">
						{pending.message}
					</p>
				</div>
			</div>
			<div className="flex items-center justify-end gap-2 shrink-0">
				<Button
					size="sm"
					variant="secondary"
					onPress={dismiss}
					isDisabled={acceptMutation.isPending}
					startContent={<X className="size-4" />}
				>
					Later
				</Button>
				<Button
					size="sm"
					variant="primary"
					onPress={onAccept}
					isPending={acceptMutation.isPending}
				>
					Accept
				</Button>
			</div>
		</div>
	);
}
