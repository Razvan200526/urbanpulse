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
					<HeroModal.Container className={cn("items-center p-20", className)}>
						<HeroModal.Dialog className="border border-border-secondary">
							{header && (
								<HeroModal.Header>
									<HeroModal.Heading>{header}</HeroModal.Heading>
								</HeroModal.Header>
							)}
							<HeroModal.Body>{children}</HeroModal.Body>
							{footer && <HeroModal.Footer>{footer}</HeroModal.Footer>}
						</HeroModal.Dialog>
					</HeroModal.Container>
				</HeroModal.Backdrop>
			</HeroModal>
		</>
	);
};
