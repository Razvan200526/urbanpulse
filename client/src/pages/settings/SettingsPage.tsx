import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { PageLoader } from "@client/components/PageLoader";
import { H6 } from "@client/components/typography";
import {
	useDeleteAccount,
	useUpdateQuietHours,
	useUserProfile,
} from "@client/hooks/useProfileSettings";
import { Card, ScrollShadow, Separator, Toast } from "@heroui/react";
import { usePostHog } from "@posthog/react";
import { AlertTriangle, Clock3, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Weekday = (typeof weekdays)[number];

export const SettingsPage = () => {
	const posthog = usePostHog();
	const navigate = useNavigate();
	const { data: profile, isPending } = useUserProfile();
	const { mutateAsync: updateQuietHours, isPending: isSavingQuietHours } =
		useUpdateQuietHours();
	const { mutateAsync: deleteAccount, isPending: isDeletingAccount } =
		useDeleteAccount();
	const [startTime, setStartTime] = useState("22:00");
	const [endTime, setEndTime] = useState("06:00");
	const startTimeId = useId();
	const endTimeId = useId();
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

	const handleDeleteAccount = async () => {
		const confirmed = window.confirm(
			"Delete your UrbanPulse account and associated data? This cannot be undone.",
		);
		if (!confirmed) {
			return;
		}

		try {
			await deleteAccount();
			posthog?.capture("account_deleted");
			posthog?.reset();
			Toast.toast.success("Account deleted");
			navigate("/", { replace: true });
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to delete account",
			);
		}
	};

	if (isPending || !profile) {
		return <PageLoader />;
	}

	return (
		<div className="flex flex-col h-[calc(100dvh)] bg-surface overflow-hidden">
			<Header title="Settings" />
			<Separator />
			<ScrollShadow className="flex-1 p-6" size={10}>
				<div className="max-w-5xl mx-auto space-y-6">
					<Card className="border border-accent shadow-none">
						<Card.Header className="flex flex-col items-start gap-1">
							<Card.Title>
								<H6>Quiet Hours</H6>
							</Card.Title>
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
						<Card.Footer className="justify-between p-6 pt-0">
							<div className="text-xs flex items-center gap-2 text-accent">
								<Clock3 className="size-4" />
								Current pulse discovery radius remains focused on nearby
								activity.
							</div>
							<Button
								variant="primary"
								onPress={saveQuietHours}
								isPending={isSavingQuietHours}
								isDisabled={days.length === 0}
							>
								Save
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

					<Card className="border border-danger/30 bg-danger/5 shadow-none">
						<Card.Header className="flex flex-col items-start gap-1">
							<Card.Title>Danger Zone</Card.Title>
							<Card.Description>
								Delete your account and remove your UrbanPulse data from the
								app.
							</Card.Description>
						</Card.Header>
						<Card.Content className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="text-sm text-muted flex items-start gap-3">
								<AlertTriangle className="size-5 text-danger shrink-0 mt-0.5" />
								<span>
									Account deletion removes your profile and cascades through the
									app data model. Make sure you really want to do this before
									continuing.
								</span>
							</div>
							<Button
								variant="danger"
								onPress={handleDeleteAccount}
								isPending={isDeletingAccount}
								startContent={<Trash2 className="size-4" />}
							>
								Delete account
							</Button>
						</Card.Content>
					</Card>
				</div>
			</ScrollShadow>
		</div>
	);
};
