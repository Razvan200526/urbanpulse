import { useCallback, useEffect, useRef } from "react";

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	opacity: number;
	baseOpacity: number;
	pulseSpeed: number;
	pulsePhase: number;
}

const PARTICLE_COUNT = 60;
const CONNECTION_DISTANCE = 120;
const MOUSE_RADIUS = 150;

export const ParticleField = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const mouseRef = useRef({ x: -1000, y: -1000 });
	const animationRef = useRef<number>(0);

	const initParticles = useCallback((width: number, height: number) => {
		const particles: Particle[] = [];
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * 0.3,
				vy: -Math.random() * 0.4 - 0.1,
				size: Math.random() * 2 + 0.5,
				opacity: 0,
				baseOpacity: Math.random() * 0.5 + 0.2,
				pulseSpeed: Math.random() * 0.02 + 0.005,
				pulsePhase: Math.random() * Math.PI * 2,
			});
		}
		particlesRef.current = particles;
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			const parent = canvas.parentElement;
			if (!parent) return;
			canvas.width = parent.clientWidth;
			canvas.height = parent.clientHeight;
			if (particlesRef.current.length === 0) {
				initParticles(canvas.width, canvas.height);
			}
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouseRef.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		};

		const handleMouseLeave = () => {
			mouseRef.current = { x: -1000, y: -1000 };
		};

		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("mouseleave", handleMouseLeave);

		const computedStyle = getComputedStyle(document.documentElement);
		const primaryColor = computedStyle
			.getPropertyValue("--color-primary")
			.trim();

		let time = 0;

		const animate = () => {
			time += 1;
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const particles = particlesRef.current;

			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;

				p.opacity =
					p.baseOpacity + Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.15;

				if (p.x < 0) p.x = canvas.width;
				if (p.x > canvas.width) p.x = 0;
				if (p.y < 0) p.y = canvas.height;
				if (p.y > canvas.height) p.y = 0;

				const dx = p.x - mouseRef.current.x;
				const dy = p.y - mouseRef.current.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < MOUSE_RADIUS) {
					const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
					p.x += (dx / dist) * force * 2;
					p.y += (dy / dist) * force * 2;
				}

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fillStyle = primaryColor
					? `color-mix(in oklch, ${primaryColor} 100%, transparent ${Math.round((1 - p.opacity) * 100)}%)`
					: `rgba(139, 92, 246, ${p.opacity})`;
				ctx.fill();
			}

			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const dx = particles[i].x - particles[j].x;
					const dy = particles[i].y - particles[j].y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < CONNECTION_DISTANCE) {
						const lineOpacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
						ctx.beginPath();
						ctx.moveTo(particles[i].x, particles[i].y);
						ctx.lineTo(particles[j].x, particles[j].y);
						ctx.strokeStyle = `rgba(139, 92, 246, ${lineOpacity})`;
						ctx.lineWidth = 0.5;
						ctx.stroke();
					}
				}
			}

			animationRef.current = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
			cancelAnimationFrame(animationRef.current);
		};
	}, [initParticles]);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 w-full h-full pointer-events-auto z-0"
		/>
	);
};
