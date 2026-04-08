import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { PageLoader } from "@client/components/PageLoader";
import { H6 } from "@client/components/typography";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import {
	useUpdateAlertPreferences,
	useUpdateQuietHours,
	useUserProfile,
} from "@client/hooks/useProfileSettings";
import { Card, ScrollShadow, Separator, Toast } from "@heroui/react";
import { usePostHog } from "@posthog/react";
import type { GeoPoint } from "@shared/types";
import { Clock3, MapPinned, Radar } from "lucide-react";
import { useEffect, useId, useState } from "react";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Weekday = (typeof weekdays)[number];

export const SettingsPage = () => {
	const posthog = usePostHog();
	const { data: profile, isPending } = useUserProfile();
	const { mutateAsync: updateQuietHours, isPending: isSavingQuietHours } =
		useUpdateQuietHours();
	const {
		mutateAsync: updateAlertPreferences,
		isPending: isSavingAlertPreferences,
	} = useUpdateAlertPreferences();
	const {
		coords,
		refresh: refreshLocation,
		isLoading: isLocating,
	} = useGetGeolocation();
	const [startTime, setStartTime] = useState("22:00");
	const [endTime, setEndTime] = useState("06:00");
	const startTimeId = useId();
	const endTimeId = useId();
	const [homeLocation, setHomeLocation] = useState<GeoPoint | null>(null);
	const [heroAlertRadiusMeters, setHeroAlertRadiusMeters] = useState(500);
	const [days, setDays] = useState<Weekday[]>([
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
	]);

	useEffect(() => {
		if (!profile?.quietHours) return;
		setStartTime(profile.quietHours.startTime);
		setEndTime(profile.quietHours.endTime);
		setDays(profile.quietHours.days as Weekday[]);
	}, [profile?.quietHours]);

	useEffect(() => {
		if (!profile?.alertPreferences) return;
		setHomeLocation(profile.alertPreferences.homeLocation);
		setHeroAlertRadiusMeters(profile.alertPreferences.heroAlertRadiusMeters);
	}, [profile?.alertPreferences]);

	const toggleDay = (day: Weekday) => {
		setDays((prev) =>
			prev.includes(day)
				? prev.filter((entry) => entry !== day)
				: [...prev, day],
		);
	};

	const saveQuietHours = async () => {
		try {
			await updateQuietHours({
				startTime,
				endTime,
				days,
			});
			Toast.toast.success("Quiet hours saved");
			posthog?.capture("quiet_hours_saved", {
				start_time: startTime,
				end_time: endTime,
				days,
			});
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to save quiet hours",
			);
		}
	};

	const saveAlertPreferences = async () => {
		try {
			await updateAlertPreferences({
				homeLocation,
				heroAlertRadiusMeters,
			});
			Toast.toast.success("Alert preferences saved");
			posthog?.capture("alert_preferences_saved", {
				hero_alert_radius_meters: heroAlertRadiusMeters,
				has_home_location: Boolean(homeLocation),
			});
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error
					? error.message
					: "Failed to save alert preferences",
			);
		}
	};

	const syncHomeLocationFromDevice = () => {
		refreshLocation();
		if (!coords) {
			Toast.toast.danger("Current device location is not ready yet");
			return;
		}

		setHomeLocation({
			x: coords.long,
			y: coords.lat,
		});
	};

	if (isPending || !profile) {
		return <PageLoader />;
	}

	return (
		<div className="flex h-[calc(100dvh)] min-w-0 flex-col overflow-hidden bg-surface w-full">
			<Header title="Settings" />
			<Separator />
			<ScrollShadow className="flex-1 p-4 sm:p-6" size={10}>
				<div className="max-w-5xl mx-auto space-y-6">
					<Card className="border border-accent shadow-none">
						<Card.Header className="flex flex-col items-start gap-1">
							<Card.Title>Quiet Hours</Card.Title>
							<Card.Description className="text-sm">
								Suppress non-urgent hero alerts during the times you specify.
							</Card.Description>
						</Card.Header>
						<Card.Content className="p-6 space-y-6">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1">
									<label
										htmlFor={startTimeId}
										className="text-sm font-semibold text-accent"
									>
										Start time
									</label>
									<input
										id={startTimeId}
										type="time"
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
										className="w-full rounded border border-accent text-accent bg-surface px-3 py-2 text-sm outline-none"
									/>
								</div>
								<div className="space-y-1">
									<label
										htmlFor={endTimeId}
										className="text-sm font-semibold text-accent"
									>
										End time
									</label>
									<input
										id={endTimeId}
										type="time"
										value={endTime}
										onChange={(e) => setEndTime(e.target.value)}
										className="w-full rounded border border-accent text-accent bg-surface px-3 py-2 text-sm outline-none"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<p className="text-sm font-semibold text-accent">Active days</p>
								<div className="flex flex-wrap gap-2">
									{weekdays.map((day) => {
										const isSelected = days.includes(day);
										return (
											<Button
												key={day}
												variant={isSelected ? "primary" : "secondary"}
												size="sm"
												onPress={() => toggleDay(day)}
											>
												{day}
											</Button>
										);
									})}
								</div>
							</div>
						</Card.Content>
						<Card.Footer className="flex flex-col items-start gap-3 p-6 pt-0 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-2 text-xs text-accent">
								<Clock3 className="size-4" />
								Quiet hours mute non-urgent matches, but urgent emergencies can
								still break through.
							</div>
							<Button
								variant="primary"
								className="w-full sm:w-auto"
								onPress={saveQuietHours}
								isPending={isSavingQuietHours}
								isDisabled={days.length === 0}
							>
								Save quiet hours
							</Button>
						</Card.Footer>
					</Card>

					<Card className="border border-accent shadow-none">
						<Card.Header className="flex flex-col items-start gap-1">
							<Card.Title>
								<H6>Hero Alert Reach</H6>
							</Card.Title>
							<Card.Description className="text-sm">
								Choose the saved location and alert radius used when UrbanPulse
								matches you to nearby requests.
							</Card.Description>
						</Card.Header>
						<Card.Content className="space-y-6 p-6">
							<div className="rounded border border-accent/30 bg-surface-secondary/40 p-4">
								<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<p className="text-sm font-semibold text-accent">
											Home location
										</p>
										<p className="mt-1 text-sm text-foreground/80">
											{homeLocation
												? `${homeLocation.y.toFixed(4)}, ${homeLocation.x.toFixed(4)}`
												: "No saved fallback location yet"}
										</p>
									</div>
									<Button
										variant="secondary"
										size="sm"
										onPress={syncHomeLocationFromDevice}
										isPending={isLocating}
										startContent={<MapPinned className="size-4" />}
									>
										Use current location
									</Button>
								</div>
								<p className="mt-3 text-xs text-muted">
									Live device location is still synced in the background.
									UrbanPulse falls back to this saved point when no fresh live
									location is available.
								</p>
								{profile.alertPreferences.lastKnownLocation && (
									<p className="mt-2 text-xs text-accent/80">
										Last live sync:{" "}
										{profile.alertPreferences.lastKnownLocation.y.toFixed(4)},{" "}
										{profile.alertPreferences.lastKnownLocation.x.toFixed(4)}
									</p>
								)}
							</div>

							<div className="space-y-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-accent">
									<Radar className="size-4" />
									Hero alert radius
								</div>
								<div className="flex flex-wrap gap-2">
									{[300, 500, 1000, 2000, 5000].map((value) => (
										<Button
											key={value}
											size="sm"
											variant={
												heroAlertRadiusMeters === value
													? "primary"
													: "secondary"
											}
											onPress={() => setHeroAlertRadiusMeters(value)}
										>
											{value >= 1000 ? `${value / 1000} km` : `${value} m`}
										</Button>
									))}
								</div>
							</div>
						</Card.Content>
						<Card.Footer className="flex flex-col items-start gap-3 p-6 pt-0 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-2 text-xs text-accent">
								<MapPinned className="size-4" />
								Smart matching uses the closest fresh live location first, then
								your saved fallback.
							</div>
							<Button
								variant="primary"
								className="w-full sm:w-auto"
								onPress={saveAlertPreferences}
								isPending={isSavingAlertPreferences}
							>
								Save alert preferences
							</Button>
						</Card.Footer>
					</Card>

					<Card className="border border-accent shadow-none">
						<Card.Header className="flex flex-col items-start gap-1">
							<Card.Title>
								<H6>Account</H6>
							</Card.Title>
							<Card.Description>
								Review the current session identity and manage your data.
							</Card.Description>
						</Card.Header>
						<Card.Content className="p-6 grid gap-4 sm:grid-cols-3">
							<div className="rounded border border-accent p-4">
								<p className="text-xs uppercase tracking-wide text-accent">
									Role
								</p>
								<p className="mt-2 font-semibold capitalize text-foreground">
									{profile.user.role ?? "user"}
								</p>
							</div>
							<div className="rounded border border-accent p-4">
								<p className="text-xs uppercase tracking-wide text-accent">
									Verification
								</p>
								<p className="mt-2 font-semibold text-foreground">
									{profile.user.isVerified ? "Verified" : "Not verified"}
								</p>
							</div>
							<div className="rounded border border-accent p-4">
								<p className="text-xs uppercase tracking-wide text-accent">
									Email status
								</p>
								<p className="mt-2 font-semibold text-foreground">
									{profile.user.emailVerified ? "Confirmed" : "Unconfirmed"}
								</p>
							</div>
						</Card.Content>
					</Card>
				</div>
			</ScrollShadow>
		</div>
	);
};
