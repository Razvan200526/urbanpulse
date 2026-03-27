import { ProgressBar, Tooltip } from "@heroui/react";
import { Pause, Play, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../Button/Button";

export type CustomPlayerProps = {
	mediaBlobUrl: string;
	ref?: React.RefObject<HTMLAudioElement | null>;
};

export const CustomPlayer = ({ mediaBlobUrl, ref }: CustomPlayerProps) => {
	const internalRef = useRef<HTMLAudioElement>(null);
	const playerRef = ref || internalRef;

	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);

	const togglePlayPause = () => {
		const prevValue = isPlaying;
		setIsPlaying(!prevValue);
		if (!prevValue) {
			playerRef.current?.play();
		} else {
			playerRef.current?.pause();
		}
	};

	const handleTimeUpdate = () => {
		if (playerRef.current) {
			setCurrentTime(playerRef.current.currentTime);
			setProgress(
				(playerRef.current.currentTime / playerRef.current.duration) * 100 || 0,
			);
		}
	};

	const handleLoadedMetadata = () => {
		if (playerRef.current) {
			setDuration(playerRef.current.duration);
		}
	};

	const handleEnded = () => {
		setIsPlaying(false);
		setProgress(0);
		setCurrentTime(0);
	};

	const formatTime = (time: number) => {
		if (!time || Number.isNaN(time)) return "00:00";
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	useEffect(() => {
		setIsPlaying(false);
		setProgress(0);
		setCurrentTime(0);
	}, []);

	return (
		<div className="flex items-center gap-3 bg-surface border border-accent rounded-full p-2 pr-4 h-10 w-72 transition-all">
			<audio
				ref={playerRef}
				src={mediaBlobUrl}
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleLoadedMetadata}
				onEnded={handleEnded}
			/>
			<div className="flex items-center justify-start gap-2">
				<Tooltip>
					<Button
						variant="ghost"
						isIconOnly
						radius="full"
						size="sm"
						onPress={togglePlayPause}
						className="bg-accent/10 hover:bg-accent-soft-hover min-w-7 w-7 h-7 text-accent shrink-0 flex items-center justify-center p-0 m-0"
					>
						{isPlaying ? (
							<Pause className="size-4" fill="currentColor" />
						) : (
							<Play className="size-4" fill="currentColor" />
						)}
					</Button>
					<Tooltip.Content className="text-xs text-accent rounded-full border border-accent bg-surface">
						Play
					</Tooltip.Content>
				</Tooltip>

				<Tooltip delay={0}>
					<Button
						variant="danger-soft"
						isIconOnly
						radius="full"
						onPress={() => {}}
						className="bg-accent/10 hover:bg-accent-soft-hover min-w-7 w-7 h-7 shrink-0"
					>
						<Trash2Icon className="size-4" />
					</Button>
					<Tooltip.Content className="text-xs text-danger rounded-full border border-danger bg-surface">
						Delete recording
					</Tooltip.Content>
				</Tooltip>
			</div>

			<div className="flex flex-row flex-1 justify-between items-center text-[10px] text-accent font-medium gap-1">
				<span>{formatTime(currentTime)}</span>
				<ProgressBar
					color="accent"
					size="sm"
					value={progress}
					aria-label="Audio progress"
					className="w-20"
				>
					<ProgressBar.Track>
						<ProgressBar.Fill />
					</ProgressBar.Track>
				</ProgressBar>
				<span>{formatTime(duration)}</span>
			</div>
		</div>
	);
};
