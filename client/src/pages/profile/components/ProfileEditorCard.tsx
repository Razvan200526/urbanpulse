import { Button } from "@client/components/Button/Button";
import type { UserProfilePayload } from "@client/hooks/useProfileSettings";
import { Card } from "@heroui/react";
import { Save } from "lucide-react";
import { useProfileEditor } from "../useProfileEditor";
import { ProfileDetailsFields } from "./ProfileDetailsFields";
import { ProfileIdentitySection } from "./ProfileIdentitySection";
import { ProfileSkillsSection } from "./ProfileSkillsSection";

export const ProfileEditorCard = ({
	profile,
}: {
	profile: UserProfilePayload;
}) => {
	const {
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
		trustRating,
		isSavingProfile,
		isSavingTags,
		addSkillTag,
		removeSkillTag,
		saveProfileDetails,
		saveSkillTags,
	} = useProfileEditor(profile);

	return (
		<Card className="border border-border shadow-none">
			<Card.Content className="space-y-6 p-6">
				<ProfileIdentitySection
					name={name || profile.user.name}
					email={profile.user.email}
					image={image}
					defaultImage={profile.user.image}
					trustRating={trustRating}
					isEmailVerified={Boolean(profile.user.emailVerified)}
					onAvatarChange={setImage}
				/>

				<ProfileSkillsSection
					skillTags={skillTags}
					draftTag={draftTag}
					isSavingTags={isSavingTags}
					onDraftTagChange={setDraftTag}
					onAddSkillTag={addSkillTag}
					onRemoveSkillTag={removeSkillTag}
					onSaveSkillTags={saveSkillTags}
				/>

				<ProfileDetailsFields
					name={name}
					bio={bio}
					nameRef={nameRef}
					bioRef={bioRef}
					onNameChange={setName}
					onBioChange={setBio}
				/>
			</Card.Content>
			<Card.Footer className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
				<Button
					variant="primary"
					className="w-full sm:w-auto"
					onPress={saveProfileDetails}
					isPending={isSavingProfile}
					startContent={<Save className="size-4" />}
				>
					Save profile
				</Button>
			</Card.Footer>
		</Card>
	);
};
