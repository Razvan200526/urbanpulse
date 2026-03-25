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
	footerClassName?: string;
	headerClassName?: string;
	trigger?: React.ReactNode;
	backdrop?: "opaque" | "blur" | "transparent";
	children: React.ReactNode;
	className?: string;
};

export const Modal = (props: ModalPropsType) => {
	const {
		modalRef,
		header,
		footer,
		footerClassName,
		headerClassName,
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

	const onOpen = () => setInternalIsOpen(true);
	const onClose = () => setInternalIsOpen(false);

	const handleOpenChange = (open: boolean) => {
		setInternalIsOpen(open);
		controlledOnOpenChange?.(open);
	};

	useImperativeHandle(modalRef, () => {
		return {
			open: onOpen,
			close: onClose,
		};
	});

	return (
		<>
			{trigger}
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
