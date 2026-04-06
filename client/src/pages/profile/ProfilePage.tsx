import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { InputAvatar } from "@client/components/input/InputAvatar";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { PageLoader } from "@client/components/PageLoader";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { H2 } from "@client/components/typography";
import {
	useDeleteAccount,
	useUpdateSkillTags,
	useUpdateUserProfile,
	useUserProfile,
} from "@client/hooks/useProfileSettings";
import { useFilterResources } from "@client/pages/resources/hooks";
import {
	AlertDialog,
	Card,
	Chip,
	ScrollShadow,
	Separator,
	Toast,
} from "@heroui/react";
import { usePostHog } from "@posthog/react";
import {
	BadgeCheck,
	BriefcaseBusiness,
	HandHelping,
	MailCheck,
	Save,
	ShieldCheck,
	Trash2,
	UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

export const ProfilePage = () => {
	const posthog = usePostHog();
	const navigate = useNavigate();
	const { data: profile, isPending } = useUserProfile();
	const { mutateAsync: updateProfile, isPending: isSavingProfile } =
		useUpdateUserProfile();
	const { mutateAsync: updateSkillTags, isPending: isSavingTags } =
		useUpdateSkillTags();
	const { mutateAsync: deleteAccount, isPending: isDeletingAccount } =
		useDeleteAccount();
	const { data: resources } = useFilterResources("All");

	const [name, setName] = useState(profile?.user.name ?? "");
	const [bio, setBio] = useState(profile?.user.bio ?? "");
	const [image, setImage] = useState<string | null>(
		profile?.user.image ?? null,
	);
	const [skillTags, setSkillTags] = useState<string[]>(
		profile?.skillTags ?? [],
	);
	const [draftTag, setDraftTag] = useState("");
	const nameRef = useRef<InputNameRefType>(null);
	const bioRef = useRef<TextAreaRefType>(null);

	useEffect(() => {
		if (!profile) return;
		setName(profile.user.name || "");
		setBio(profile.user.bio || "");
		setImage(profile.user.image);
		setSkillTags(profile.skillTags);
		nameRef.current?.setValue(profile.user.name || "");
		bioRef.current?.setValue(profile.user.bio || "");
	}, [profile]);

	const offerCount = useMemo(() => {
		return (resources ?? []).filter(
			(item) => item.resource.userId === profile?.user.id,
		).length;
	}, [profile?.user.id, resources]);
	const trustScore = Math.round(profile?.user.trustScore ?? 0);
	const trustRating = Math.min(5, Number((trustScore / 20).toFixed(1)));
	const successfulInteractions = profile?.user.successfulInteractions ?? 0;
	const isIdentityVerified = Boolean(profile?.user.isVerified);
	const isEmailVerified = Boolean(profile?.user.emailVerified);

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
			const nextName = nameRef.current?.getValue().trim() ?? name.trim();
			const nextBio = bioRef.current?.getValue().trim() ?? bio.trim();
			await updateProfile({
				name: nextName,
				bio: nextBio,
				image,
			});
			setName(nextName);
			setBio(nextBio);
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
			await updateSkillTags({ tags: skillTags });
			Toast.toast.success("Skill tags updated");
			posthog?.capture("skill_tags_updated", { tag_count: skillTags.length });
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to update skill tags",
			);
		}
	};

	const handleDeleteAccount = async () => {
		try {
			await deleteAccount();
			posthog?.capture("account_deleted");
			posthog?.reset();
			Toast.toast.success("Account deleted");
			navigate("/", { replace: true });
			return true;
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to delete account",
			);
			return false;
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
				<div className="mx-auto max-w-6xl space-y-6">
					<div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
						<div className="space-y-6">
							<Card className="border border-border shadow-none">
								<Card.Content className="space-y-6 p-6">
									<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
										<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
											<InputAvatar
												value={image || profile.user.image || undefined}
												onAvatarChange={(url) => setImage(url)}
											/>
											<div className="space-y-3">
												<div className="space-y-1">
													<H2>{name || profile.user.name}</H2>
													<p className="text-sm text-muted">
														{profile.user.email}
													</p>
												</div>
												<div className="flex flex-wrap gap-2">
													<Chip
														color={isEmailVerified ? "success" : "default"}
														variant="soft"
														size="sm"
													>
														<Chip.Label className="flex items-center gap-2">
															<MailCheck className="size-3" />
															{isEmailVerified
																? "Email confirmed"
																: "Email unconfirmed"}
														</Chip.Label>
													</Chip>
													<Chip
														color={isIdentityVerified ? "accent" : "default"}
														variant="soft"
														size="sm"
													>
														<Chip.Label className="flex items-center gap-2">
															<UserRoundCheck className="size-3" />
															{isIdentityVerified
																? "Identity verified"
																: "Identity review pending"}
														</Chip.Label>
													</Chip>
												</div>
											</div>
										</div>
										<div className="min-w-[220px] rounded border border-border bg-surface-secondary p-4">
											<p className="text-sm font-medium text-foreground">
												Trust rating
											</p>
											<div className="mt-3 flex items-end justify-between gap-4">
												<p className="text-4xl font-semibold leading-none text-foreground">
													{trustRating.toFixed(1)}
												</p>
												<div className="text-right text-sm text-muted">
													<p>Based on your current trust score</p>
													<p>{trustScore} internal points</p>
												</div>
											</div>
										</div>
									</div>

									<div className="space-y-3 border-t border-border pt-6">
										<div className="flex items-center justify-between gap-3">
											<p className="text-sm font-semibold text-foreground">
												Skills
											</p>
											<p className="text-sm text-muted">
												Keep these current so neighbours can find the right help
												faster.
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											{skillTags.length > 0 ? (
												skillTags.map((tag) => (
													<Chip
														key={tag}
														color="accent"
														variant="soft"
														className="rounded-full p-1"
													>
														<Chip.Label className="flex items-center gap-1">
															<HandHelping className="size-3" />
															{tag}
															<button
																type="button"
																className="text-xs text-muted transition-colors hover:text-danger"
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

										<div className="flex flex-col gap-3 md:flex-row">
											<input
												value={draftTag}
												onChange={(e) => setDraftTag(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														addSkillTag();
													}
												}}
												className="h-11 flex-1 rounded border border-border bg-field-background px-3 text-sm text-field-foreground outline-none transition-colors focus:border-accent"
												placeholder="Add a skill tag like First Aid or Heavy Lifting"
											/>
											<div className="flex gap-3 items-center">
												<Button
													size="sm"
													variant="secondary"
													onPress={addSkillTag}
												>
													Add skill
												</Button>
												<Button
													size="sm"
													variant="primary"
													onPress={saveSkillTags}
													isPending={isSavingTags}
													startContent={<ShieldCheck className="size-4" />}
												>
													Save skills
												</Button>
											</div>
										</div>
									</div>

									<div className="grid gap-4 border-t border-border pt-6">
										<div className="space-y-2">
											<InputName
												ref={nameRef}
												label="Display name"
												initialValue={name}
												showIcon={false}
												required={false}
												onChange={(value) => setName(value)}
												placeholder="Your name"
											/>
										</div>
										<div className="space-y-2">
											<TextArea
												ref={bioRef}
												label="Bio"
												initialValue={bio}
												required={false}
												showIcon={false}
												minRows={5}
												maxRows={8}
												onChange={(event) => setBio(event.target.value)}
												inputWrapperClassname="min-h-40 rounded border-border bg-field-background px-3 py-3 text-sm text-field-foreground"
												placeholder="Tell neighbours how you like to help."
											/>
										</div>
									</div>
								</Card.Content>
								<Card.Footer className="justify-end border-t border-border px-6 py-4">
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
						</div>

						<div className="space-y-4">
							<Card className="border border-border shadow-none">
								<Card.Header className="flex flex-row items-start gap-3">
									<div className="rounded border border-border bg-surface-secondary p-2 text-accent">
										<BriefcaseBusiness className="size-4" />
									</div>
									<div className="space-y-1">
										<Card.Title>Profile summary</Card.Title>
										<Card.Description>
											Only live UrbanPulse account signals appear here.
										</Card.Description>
									</div>
								</Card.Header>
							</Card>

							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
								<Card className="border border-border shadow-none">
									<Card.Content className="space-y-2 p-5">
										<p className="text-sm text-muted">Active offers</p>
										<p className="text-3xl font-semibold text-foreground">
											{offerCount}
										</p>
										<p className="text-sm text-muted">
											Offer{offerCount === 1 ? "" : "s"} currently listed from
											your account.
										</p>
									</Card.Content>
								</Card>

								<Card className="border border-border shadow-none">
									<Card.Content className="space-y-2 p-5">
										<p className="text-sm text-muted">
											Successful interactions
										</p>
										<p className="text-3xl font-semibold text-foreground">
											{successfulInteractions}
										</p>
										<p className="text-sm text-muted">
											Completed help interaction
											{successfulInteractions === 1 ? "" : "s"} recorded so far.
										</p>
									</Card.Content>
								</Card>

								<Card className="border border-border shadow-none">
									<Card.Content className="space-y-3 p-5">
										<div className="flex items-center gap-2 text-sm font-medium text-foreground">
											<BadgeCheck className="size-4 text-accent" />
											Account verification
										</div>
										<div className="space-y-2 text-sm text-muted">
											<p>
												Identity:{" "}
												<span className="font-medium text-foreground">
													{isIdentityVerified ? "Verified" : "Pending"}
												</span>
											</p>
											<p>
												Email:{" "}
												<span className="font-medium text-foreground">
													{isEmailVerified ? "Confirmed" : "Unconfirmed"}
												</span>
											</p>
										</div>
									</Card.Content>
								</Card>

								<Card className="border border-border shadow-none">
									<Card.Content className="space-y-3 p-5">
										<div className="flex items-center gap-2 text-sm font-medium text-foreground">
											<UserRoundCheck className="size-4 text-accent" />
											Account role
										</div>
										<p className="text-2xl font-semibold capitalize text-foreground">
											{profile.user.role ?? "user"}
										</p>
										<p className="text-sm text-muted">
											This role reflects your current UrbanPulse permissions.
										</p>
									</Card.Content>
								</Card>
							</div>
						</div>
					</div>

					<Card className="border border-danger/30 shadow-none">
						<Card.Header className="flex flex-col items-start gap-1">
							<Card.Title>Delete account</Card.Title>
							<Card.Description>
								Remove your profile and the personal data attached to this
								account.
							</Card.Description>
						</Card.Header>
						<Card.Content className="flex flex-col gap-4 border-t border-border px-6 py-5 md:flex-row md:items-center md:justify-between">
							<p className="max-w-3xl text-sm text-muted">
								This permanently deletes your UrbanPulse account, profile data,
								and any dependent records tied to your identity. This action
								cannot be undone.
							</p>
							<AlertDialog>
								<Button
									variant="danger"
									startContent={<Trash2 className="size-4" />}
								>
									Delete account
								</Button>
								<AlertDialog.Backdrop
									isDismissable={false}
									isKeyboardDismissDisabled
								>
									<AlertDialog.Container placement="center" size="sm">
										<AlertDialog.Dialog className="mx-4 w-full max-w-md rounded border border-danger/20 bg-surface">
											{(dialog) => (
												<>
													<AlertDialog.Header className="items-start border-b border-border px-5 py-4">
														<AlertDialog.Icon status="danger" />
														<AlertDialog.Heading>
															Delete your account?
														</AlertDialog.Heading>
													</AlertDialog.Header>
													<AlertDialog.Body className="px-5 py-4 text-sm text-muted">
														<p>
															Deleting your account removes your profile,
															skills, and account-linked activity from
															UrbanPulse. If you continue, your data cannot be
															restored.
														</p>
													</AlertDialog.Body>
													<AlertDialog.Footer className="border-t border-border px-5 py-4">
														<Button
															variant="tertiary"
															onPress={() => dialog.close()}
														>
															Keep account
														</Button>
														<Button
															variant="danger"
															onPress={async () => {
																const deleted = await handleDeleteAccount();
																if (deleted) {
																	dialog.close();
																}
															}}
															isPending={isDeletingAccount}
														>
															Delete my data
														</Button>
													</AlertDialog.Footer>
												</>
											)}
										</AlertDialog.Dialog>
									</AlertDialog.Container>
								</AlertDialog.Backdrop>
							</AlertDialog>
						</Card.Content>
					</Card>
				</div>
			</ScrollShadow>
		</div>
	);
};
