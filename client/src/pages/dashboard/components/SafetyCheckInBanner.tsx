import { Button } from "@client/components/Button/Button";
import { useWeatherAlerts } from "@client/hooks/useWeatherAlerts";
import { Card } from "@heroui/react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

type Props = {
	lat: number | undefined;
	lon: number | undefined;
	geoReady: boolean;
};

/**
 * Pinned when OpenWeather reports a severe alert for the user coordinates.
 */
export function SafetyCheckInBanner({ lat, lon, geoReady }: Props) {
	const navigate = useNavigate();
	const { data, isPending, isError } = useWeatherAlerts(lat, lon);

	if (!geoReady || isPending || isError || !data?.configured || !data.severe) {
		return null;
	}

	return (
		<Card className="border-2 border-danger/40 bg-danger/5 shadow-none">
			<Card.Content className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-3 min-w-0">
					<div className="shrink-0 p-2 rounded-full bg-danger/15 border border-danger/30">
						<AlertTriangle className="size-6 text-danger" />
					</div>
					<div className="min-w-0">
						<h3 className="font-semibold text-danger flex items-center gap-2 text-sm sm:text-base">
							Safety check-in
							<span className="text-xs font-normal text-muted">
								Severe weather near you
							</span>
						</h3>
						<p className="text-xs text-muted mt-1 leading-relaxed">
							{data.alerts.find((a) => a.severe)?.event ??
								"Authorities have issued a significant weather alert."}{" "}
							Let neighbors know you are okay or if you need help.
						</p>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row gap-2 shrink-0">
					<Button
						variant="danger"
						size="sm"
						startContent={<ShieldCheck className="size-4" />}
						onPress={() =>
							navigate("/map", { state: { safetyCheckin: true } })
						}
					>
						Post check-in pulse
					</Button>
					<Button
						variant="outline"
						size="sm"
						onPress={() => navigate("/map")}
					>
						View map
					</Button>
				</div>
			</Card.Content>
		</Card>
	);
}
