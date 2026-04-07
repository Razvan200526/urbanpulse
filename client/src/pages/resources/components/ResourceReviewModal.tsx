import { Button } from "@client/components/Button/Button";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { H3 } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { Toast } from "@heroui/react";
import { Star } from "lucide-react";
import { useRef, useState } from "react";
import { useSubmitResourceReview } from "../hooks";

export const ResourceReviewModal = ({
	modalRef,
	transactionId,
	resourceId,
	onSubmitted,
}: {
	modalRef: React.RefObject<ModalRefType | null>;
	transactionId: string | null;
	resourceId: string;
	onSubmitted?: () => void;
}) => {
	const { data: user } = useAuth();
	const commentRef = useRef<TextAreaRefType>(null);
	const [rating, setRating] = useState(0);
	const { mutateAsync: submitReview, isPending } = useSubmitResourceReview(
		user?.user.id || "",
	);

	const reset = () => {
		setRating(0);
		commentRef.current?.setValue("");
	};

	const closeModal = () => {
		reset();
		modalRef.current?.close();
	};

	const handleSubmit = async () => {
		if (!transactionId) return;
		if (rating === 0) {
			Toast.toast.danger("Choose a rating before submitting.");
			return;
		}

		await submitReview({
			transactionId,
			resourceId,
			rating,
			comment: commentRef.current?.getValue(),
		});
		closeModal();
		onSubmitted?.();
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start">
					<H3>Review Resource</H3>
					<p className="text-muted text-sm">Rate your borrowing experience</p>
				</header>
			}
			footer={
				<div className="w-full flex items-center justify-end gap-3">
					<Button variant="danger-soft" size="sm" onPress={closeModal}>
						Close
					</Button>
					<Button
						variant="primary"
						size="sm"
						onPress={handleSubmit}
						isPending={isPending}
					>
						Submit review
					</Button>
				</div>
			}
		>
			<div className="p-4 flex flex-col gap-5">
				<div className="flex items-center gap-2" aria-label="Rating">
					{[1, 2, 3, 4, 5].map((value) => (
						<Button
							key={value}
							size="sm"
							variant="ghost"
							isIconOnly
							aria-label={`${value} star${value === 1 ? "" : "s"}`}
							onPress={() => setRating(value)}
						>
							<Star
								className={`size-5 text-warning ${value <= rating ? "fill-warning" : ""}`}
							/>
						</Button>
					))}
				</div>
				<TextArea
					ref={commentRef}
					label="Comment"
					placeholder="Leave a comment..."
					maxLength={500}
				/>
			</div>
		</Modal>
	);
};
