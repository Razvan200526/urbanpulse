import { Button } from "@client/components/Button/Button";
import { XSquareIcon } from "lucide-react";
import { useState } from "react";

export const ImageList = ({ imageUrls }: { imageUrls: string[] }) => {
	const [images, setImages] = useState(imageUrls);
	return (
		<div className="flex gap-2 items-center overflow-x-auto pb-2 scrollbar-thin">
			{images.map((url) => (
				<div
					key={url}
					className="relative w-16 h-16 shrink-0 rounded overflow-hidden border border-border"
				>
					<img
						src={url}
						alt={`upload-${url}`}
						className="w-full h-full object-cover"
					/>
					<Button
						isIconOnly
						size="sm"
						variant="danger"
						className="absolute top-1 right-1 h-5 w-5 min-w-0 min-h-0 rounded-full bg-danger-soft-hover"
						onPress={() => setImages((p) => p.filter((u) => u !== url))}
					>
						<XSquareIcon className="size-3" />
					</Button>
				</div>
			))}
		</div>
	);
};
