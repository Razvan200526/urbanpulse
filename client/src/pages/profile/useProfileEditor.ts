import type { InputNameRefType } from "@client/components/input/InputName";
import type { TextAreaRefType } from "@client/components/TextArea";
import {
	type UserProfilePayload,
	useUpdateSkillTags,
	useUpdateUserProfile,
} from "@client/hooks/useProfileSettings";
import { Toast } from "@heroui/react";
import { usePostHog } from "@posthog/react";
import { useEffect, useMemo, useRef, useState } from "react";

export const useProfileEditor = (profile: UserProfilePayload) => {
	const posthog = usePostHog();
	const { mutateAsync: updateProfile, isPending: isSavingProfile } =
		useUpdateUserProfile();
	const { mutateAsync: updateSkillTags, isPending: isSavingTags } =
		useUpdateSkillTags();

	const [name, setName] = useState(profile.user.name ?? "");
	const [bio, setBio] = useState(profile.user.bio ?? "");
	const [image, setImage] = useState<string | null>(profile.user.image ?? null);
	const [skillTags, setSkillTags] = useState<string[]>(profile.skillTags ?? []);
	const [draftTag, setDraftTag] = useState("");
	const nameRef = useRef<InputNameRefType>(null);
	const bioRef = useRef<TextAreaRefType>(null);

	useEffect(() => {
		setName(profile.user.name || "");
		setBio(profile.user.bio || "");
		setImage(profile.user.image);
		setSkillTags(profile.skillTags);
		setDraftTag("");
		nameRef.current?.setValue(profile.user.name || "");
		bioRef.current?.setValue(profile.user.bio || "");
	}, [profile]);

	const trustScore = useMemo(
		() => Math.round(profile.user.trustScore ?? 0),
		[profile.user.trustScore],
	);
	const trustRating = useMemo(
		() => Math.min(5, Number((trustScore / 20).toFixed(1))),
		[trustScore],
	);

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

	const removeSkillTag = (tag: string) => {
		setSkillTags((prev) => prev.filter((entry) => entry !== tag));
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

	return {
		name,
		setName,
		bio,
		setBio,
		image,
		setImage,
		skillTags,
		draftTag,
		setDraftTag,
		nameRef,
		bioRef,
		trustScore,
		trustRating,
		isSavingProfile,
		isSavingTags,
		addSkillTag,
		removeSkillTag,
		saveProfileDetails,
		saveSkillTags,
	};
};
