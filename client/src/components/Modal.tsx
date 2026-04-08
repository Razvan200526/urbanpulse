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
	trigger?: React.ReactNode | ((open: () => void) => React.ReactNode);
	children: React.ReactNode;
	className?: string;
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
		className,
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
		<>
			{renderedTrigger}
			<HeroModal isOpen={isOpen} onOpenChange={handleOpenChange} {...rest}>
				<HeroModal.Backdrop
					isOpen={isOpen}
					onOpenChange={handleOpenChange}
					variant={backdrop ?? "opaque"}
				>
					<HeroModal.Container
						placement={isMobile ? "bottom" : "center"}
						scroll="inside"
						className={cn(
							"px-0 pt-6 pb-0 md:p-6",
							isMobile ? "items-end" : "items-center",
							className,
						)}
					>
						<HeroModal.Dialog
							className={cn(
								"flex flex-col relative overflow-hidden border border-border-secondary bg-surface shadow-2xl",
								isMobile
									? "max-h-[88dvh] w-full rounded-t-sm border-x-0 border-b-0"
									: "mx-4 w-full max-w-3xl rounded-sm",
							)}
						>
							{header && (
								<HeroModal.Header className="border-b border-border/60 px-4 pt-5 pb-4 pr-14 md:px-6 md:pt-6">
									<HeroModal.Heading>{header}</HeroModal.Heading>
								</HeroModal.Header>
							)}
							<HeroModal.Body className="flex-1 min-h-0 overflow-y-auto">
								{children}
							</HeroModal.Body>
							{footer && (
								<HeroModal.Footer className="border-t border-border/60 bg-surface/95 px-4 py-4 backdrop-blur md:px-6 md:py-5">
									{footer}
								</HeroModal.Footer>
							)}
						</HeroModal.Dialog>
					</HeroModal.Container>
				</HeroModal.Backdrop>
			</HeroModal>
		</>
	);
};
