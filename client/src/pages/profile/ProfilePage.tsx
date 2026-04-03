import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { InputAvatar } from "@client/components/input/InputAvatar";
import { PageLoader } from "@client/components/PageLoader";
import {
	useUpdateSkillTags,
	useUpdateUserProfile,
	useUserProfile,
} from "@client/hooks/useProfileSettings";
import { useFilterResources } from "@client/pages/resources/hooks";
import { Card, Chip, ScrollShadow, Separator, Toast } from "@heroui/react";
import { usePostHog } from "@posthog/react";
import {
	BadgeCheck,
	HandHelping,
	Save,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

export const ProfilePage = () => {
	const posthog = usePostHog();
	const { data: profile, isPending } = useUserProfile();
	const { mutateAsync: updateProfile, isPending: isSavingProfile } =
		useUpdateUserProfile();
	const { mutateAsync: updateSkillTags, isPending: isSavingTags } =
		useUpdateSkillTags();
	const { data: resources } = useFilterResources("All");

	const [name, setName] = useState("");
	const [bio, setBio] = useState("");
	const [image, setImage] = useState<string | null>(null);
	const [skillTags, setSkillTags] = useState<string[]>([]);
	const [draftTag, setDraftTag] = useState("");
	const displayNameId = useId();
	const bioId = useId();

	useEffect(() => {
		if (!profile) return;
		setName(profile.user.name || "");
		setBio(profile.user.bio || "");
		setImage(profile.user.image);
		setSkillTags(profile.skillTags);
	}, [profile]);

	const offerCount = useMemo(() => {
		return (resources ?? []).filter(
			(item) => item.resource.userId === profile?.user.id,
		).length;
	}, [profile?.user.id, resources]);

	const addSkillTag = () => {
		const cleaned = draftTag.trim();
		if (!cleaned) return;
		if (skillTags.includes(cleaned)) {
			setDraftTag("");
			return;
		}
		setSkillTags((prev) => [...prev, cleaned]);
		setDraftTag("");
	};

	const saveProfileDetails = async () => {
		try {
			await updateProfile({
				name: name.trim(),
				bio: bio.trim(),
				image,
			});
			Toast.toast.success("Profile updated");
			posthog?.capture("profile_updated");
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to update profile",
			);
		}
	};

	const saveSkillTags = async () => {
		try {
			await updateSkillTags(skillTags);
			Toast.toast.success("Skill tags updated");
			posthog?.capture("skill_tags_updated", { tag_count: skillTags.length });
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to update skill tags",
			);
		}
	};

	if (isPending || !profile) {
		return <PageLoader />;
	}

	return (
		<div className="flex flex-col h-[calc(100dvh)] bg-surface overflow-hidden">
			<Header title="Profile" />
			<Separator />
			<ScrollShadow className="flex-1 p-6" size={10}>
				<div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[320px,1fr]">
					<Card className="border border-border shadow-none h-fit">
						<Card.Content className="p-6 flex flex-col items-center text-center gap-4">
							<InputAvatar
								value={image || undefined}
								onAvatarChange={(url) => setImage(url)}
							/>
							<div>
								<h2 className="text-xl font-semibold text-foreground">
									{profile.user.name}
								</h2>
								<p className="text-sm text-muted">{profile.user.email}</p>
							</div>
							<div className="flex flex-wrap justify-center gap-2">
								<Chip color="accent" variant="soft" size="sm">
									<Chip.Label className="flex items-center gap-1">
										<Sparkles className="size-3" />
										Trust {Math.round(profile.user.trustScore ?? 0)}
									</Chip.Label>
								</Chip>
								<Chip
									color={profile.user.isVerified ? "success" : "default"}
									variant="soft"
									size="sm"
								>
									<Chip.Label className="flex items-center gap-1">
										<BadgeCheck className="size-3" />
										{profile.user.isVerified
											? "Verified neighbour"
											: "Verification pending"}
									</Chip.Label>
								</Chip>
							</div>
							<div className="grid grid-cols-2 gap-3 w-full">
								<div className="rounded border border-border p-3 text-left">
									<p className="text-xs uppercase tracking-wide text-muted">
										Offers
									</p>
									<p className="text-lg font-semibold">{offerCount}</p>
								</div>
								<div className="rounded border border-border p-3 text-left">
									<p className="text-xs uppercase tracking-wide text-muted">
										Successful help
									</p>
									<p className="text-lg font-semibold">
										{profile.user.successfulInteractions ?? 0}
									</p>
								</div>
							</div>
						</Card.Content>
					</Card>

					<div className="space-y-6">
						<Card className="border border-border shadow-none">
							<Card.Header className="flex flex-col items-start gap-1">
								<Card.Title>Identity</Card.Title>
								<Card.Description>
									Keep your UrbanPulse profile accurate so neighbours know who
									they are helping.
								</Card.Description>
							</Card.Header>
							<Card.Content className="p-6 space-y-4">
								<div className="space-y-1">
									<label
										htmlFor={displayNameId}
										className="text-sm font-semibold text-accent"
									>
										Display name
									</label>
									<input
										id={displayNameId}
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="w-full rounded border border-accent bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
										placeholder="Your name"
									/>
								</div>
								<div className="space-y-1">
									<label
										htmlFor={bioId}
										className="text-sm font-semibold text-accent"
									>
										Bio
									</label>
									<textarea
										id={bioId}
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										className="min-h-36 w-full rounded border border-accent bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
										placeholder="Tell neighbours how you like to help."
									/>
								</div>
							</Card.Content>
							<Card.Footer className="justify-end p-6 pt-0">
								<Button
									variant="primary"
									onPress={saveProfileDetails}
									isPending={isSavingProfile}
									startContent={<Save className="size-4" />}
								>
									Save profile
								</Button>
							</Card.Footer>
						</Card>

						<Card className="border border-border shadow-none">
							<Card.Header className="flex flex-col items-start gap-1">
								<Card.Title>Skill Tags</Card.Title>
								<Card.Description>
									These tags power discovery and future hero-alert matching.
								</Card.Description>
							</Card.Header>
							<Card.Content className="p-6 space-y-4">
								<div className="flex flex-wrap gap-2">
									{skillTags.length > 0 ? (
										skillTags.map((tag) => (
											<Chip key={tag} color="accent" variant="soft" size="sm">
												<Chip.Label className="flex items-center gap-2">
													<HandHelping className="size-3" />
													{tag}
													<button
														type="button"
														className="text-xs text-muted hover:text-danger"
														onClick={() =>
															setSkillTags((prev) =>
																prev.filter((entry) => entry !== tag),
															)
														}
													>
														Remove
													</button>
												</Chip.Label>
											</Chip>
										))
									) : (
										<p className="text-sm text-muted">
											No skill tags added yet.
										</p>
									)}
								</div>

								<div className="flex flex-col gap-3 sm:flex-row">
									<input
										value={draftTag}
										onChange={(e) => setDraftTag(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addSkillTag();
											}
										}}
										className="flex-1 rounded border border-accent bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
										placeholder="Add a skill tag like First Aid or Heavy Lifting"
									/>
									<Button variant="outline" onPress={addSkillTag}>
										Add tag
									</Button>
								</div>
							</Card.Content>
							<Card.Footer className="justify-end p-6 pt-0">
								<Button
									variant="primary"
									onPress={saveSkillTags}
									isPending={isSavingTags}
									startContent={<ShieldCheck className="size-4" />}
								>
									Save skill tags
								</Button>
							</Card.Footer>
						</Card>
					</div>
				</div>
			</ScrollShadow>
		</div>
	);
};
