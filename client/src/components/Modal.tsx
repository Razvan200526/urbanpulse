import { cn, Modal as HeroModal, type ModalProps } from "@heroui/react";

export type ModalRefType = {
	open: () => void;
	close: () => void;
};

export type ModalPropsType = ModalProps & {
	header?: React.ReactNode;
	footer?: React.ReactNode;
	modalRef?: React.RefObject<ModalRefType | null>;
	footerClassName?: string;
	headerClassName?: string;
	trigger: React.ReactNode;
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
		isOpen,
		onOpenChange,
		className,
		...rest
	} = props;

	return (
		<HeroModal isOpen={isOpen} onOpenChange={onOpenChange} {...rest}>
			{trigger}
			<HeroModal.Backdrop
				isOpen={isOpen}
				onOpenChange={onOpenChange}
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
	);
};
