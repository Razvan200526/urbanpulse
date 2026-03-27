import { Tooltip } from "@heroui/react";
import { MicIcon, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Button } from "../Button/Button";
import { CustomPlayer } from "./CustomPlayer";

const AudioVisualizer = ({ stream }: { stream: MediaStream | null }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!stream || !canvasRef.current) return;

		const AudioContext =
			window.AudioContext || (window as any).webkitAudioContext;
		const audioContext = new AudioContext();
		const analyser = audioContext.createAnalyser();
		const source = audioContext.createMediaStreamSource(stream);

		source.connect(analyser);
		analyser.fftSize = 256;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		const canvas = canvasRef.current;
		const canvasCtx = canvas.getContext("2d");

		let animationFrameId: number;

		const draw = () => {
			if (!canvasCtx) return;
			const width = canvas.width;
			const height = canvas.height;

			analyser.getByteFrequencyData(dataArray);

			canvasCtx.clearRect(0, 0, width, height);

			const barWidth = (width / bufferLength) * 2.5;
			let barHeight: any;
			let x = 0;

			for (let i = 0; i < bufferLength; i++) {
				barHeight = dataArray[i] / 2;
				canvasCtx.fillStyle = `oklch(62.04% 0.195 299.94)`; // Corresponds to --accent in index.css
				canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
				x += barWidth + 1;
			}

			animationFrameId = requestAnimationFrame(draw);
		};

		draw();

		return () => {
			cancelAnimationFrame(animationFrameId);
			source.disconnect();
			analyser.disconnect();
			if (audioContext.state !== "closed") {
				audioContext.close().catch(() => {});
			}
		};
	}, [stream]);

	return (
		<canvas
			ref={canvasRef}
			className="h-full w-full opacity-80"
			width={300}
			height={40}
		/>
	);
};

export type AudioRecorderProps = {
	onRecordingComplete?: (blobUrl: string) => void;
	audioRef?: React.RefObject<HTMLAudioElement | null>;
};

export const AudioRecorder = ({
	onRecordingComplete,
	audioRef,
}: AudioRecorderProps) => {
	const {
		status,
		startRecording,
		stopRecording,
		mediaBlobUrl,
		previewAudioStream,
	} = useReactMediaRecorder({
		audio: true,
		blobPropertyBag: {
			type: "audio/wav",
		},
		onStop: (blobUrl) => {
			if (onRecordingComplete) {
				onRecordingComplete(blobUrl);
			}
		},
	});

	return (
		<div className="flex items-center gap-2">
			{status === "idle" && (
				<Tooltip delay={0}>
					<span className="inline-block">
						<Button
							variant="outline"
							isIconOnly
							radius="full"
							onPress={() => startRecording()}
						>
							<MicIcon className="size-4 text-accent" />
						</Button>
					</span>
				</Tooltip>
			)}
			{status === "recording" && (
				<div className="flex items-center gap-3 bg-surface border border-accent rounded-full p-2 w-72 shadow-sm transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
					<Tooltip delay={0}>
						<span className="inline-block">
							<Button
								variant="ghost"
								isIconOnly
								radius="full"
								onPress={() => stopRecording()}
								className="bg-accent/10 hover:bg-accent-soft-hover min-w-10 w-10 h-10 shrink-0"
							>
								<Square className="size-4 text-accent" fill="currentColor" />
							</Button>
						</span>
					</Tooltip>
					<div className="flex-1 overflow-hidden h-8 flex items-center justify-center">
						<AudioVisualizer stream={previewAudioStream} />
					</div>
					<div className="flex items-center justify-center pr-3 shrink-0 gap-1.5 ">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
						</span>
						<span className="text-[10px] uppercase font-bold text-accent tracking-wider">
							Rec
						</span>
					</div>
				</div>
			)}
			{(status === "stopped" || status === "idle") && mediaBlobUrl && (
				<div className="animate-in fade-in zoom-in-95 duration-300">
					<CustomPlayer ref={audioRef} mediaBlobUrl={mediaBlobUrl} />
				</div>
			)}
		</div>
	);
};
