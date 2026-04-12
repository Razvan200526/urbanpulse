import { useIsMobile } from "@client/hooks/useMediaQuery";
import { cn, Modal as HeroModal, type ModalProps } from "@heroui/react";
import { useImperativeHandle, useState } from "react";

export type ModalRefType = {
	open: () => void;
	close: () => void;
};

export type ModalPropsType = Omit<ModalProps, "children"> & {
	header?: React.ReactNode;
	footer?: React.ReactNode;
	modalRef?: React.RefObject<ModalRefType | null>;
	backdrop?: "opaque" | "blur" | "transparent";
	placement?: "auto" | "top" | "center" | "bottom";
	scroll?: "inside" | "outside";
	size?: "xs" | "sm" | "md" | "lg" | "cover" | "full";
	isDismissable?: boolean;
	isKeyboardDismissDisabled?: boolean;
	trigger?: React.ReactNode | ((open: () => void) => React.ReactNode);
	children: React.ReactNode;
	className?: string;
	dialogClassName?: string;
	headerClassName?: string;
	bodyClassName?: string;
	footerClassName?: string;
};

export const Modal = (props: ModalPropsType) => {
	const {
		modalRef,
		header,
		footer,
		backdrop,
		trigger,
		children,
		isOpen: controlledIsOpen,
		onOpenChange: controlledOnOpenChange,
		placement,
		scroll = "inside",
		size,
		isDismissable = true,
		isKeyboardDismissDisabled,
		className,
		dialogClassName,
		headerClassName,
		bodyClassName,
		footerClassName,
		...rest
	} = props;

	const [internalIsOpen, setInternalIsOpen] = useState(false);
	const isOpen = controlledIsOpen ?? internalIsOpen;
	const isMobile = useIsMobile();

	const handleOpenChange = (open: boolean) => {
		setInternalIsOpen(open);
		controlledOnOpenChange?.(open);
	};

	const onOpen = () => handleOpenChange(true);
	const onClose = () => handleOpenChange(false);

	useImperativeHandle(modalRef, () => {
		return {
			open: onOpen,
			close: onClose,
		};
	});

	const renderedTrigger =
		typeof trigger === "function" ? trigger(onOpen) : trigger;

	return (
		<HeroModal isOpen={isOpen} onOpenChange={handleOpenChange} {...rest}>
			<HeroModal.Trigger tabIndex={0}>{renderedTrigger}</HeroModal.Trigger>
			<HeroModal.Backdrop
				isOpen={isOpen}
				onOpenChange={handleOpenChange}
				isDismissable={isDismissable}
				isKeyboardDismissDisabled={isKeyboardDismissDisabled}
				variant={backdrop ?? "opaque"}
			>
				<HeroModal.Container
					placement={placement ?? (isMobile ? "bottom" : "center")}
					scroll={scroll}
					size={size}
					className={cn(
						"rounded px-0 pt-0 pb-0 sm:px-4 sm:py-6",
						isMobile ? "items-end" : "items-center",
						className,
					)}
				>
					<HeroModal.Dialog
						className={cn(
							"relative flex w-full flex-col overflow-hidden border border-border-secondary bg-surface",
							isMobile
								? "max-h-[90dvh] rounded-t-lg border-x-0 border-b-0"
								: "mx-4 max-h-[min(84dvh,56rem)] w-2xl max-w-3xl rounded",
							dialogClassName,
						)}
					>
						{header && (
							<HeroModal.Header
								className={cn(
									"px-4 pt-4 pb-4 pr-14 sm:px-6",
									isMobile && "pt-5",
									headerClassName,
								)}
							>
								{typeof header === "string" || typeof header === "number" ? (
									<HeroModal.Heading>{header}</HeroModal.Heading>
								) : (
									header
								)}
							</HeroModal.Header>
						)}
						<HeroModal.Body
							className={cn(
								"min-h-0 flex-1 overflow-y-auto overscroll-contain",
								bodyClassName,
							)}
						>
							{children}
						</HeroModal.Body>
						{footer && (
							<HeroModal.Footer
								className={cn(
									"bg-surface/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5",
									"*:w-full sm:*:w-auto",
									isMobile && "pb-[calc(1rem+env(safe-area-inset-bottom))]",
									footerClassName,
								)}
							>
								{footer}
							</HeroModal.Footer>
						)}
					</HeroModal.Dialog>
				</HeroModal.Container>
			</HeroModal.Backdrop>
		</HeroModal>
	);
};
