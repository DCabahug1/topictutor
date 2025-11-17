import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Profile } from "@/lib/models";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { uploadProfileImage, updateProfile } from "@/lib/profiles";

interface formFields {
  image: File | undefined;
  name: string;
}

function ProfileCard({
  profile,
  fetchProfile,
}: {
  profile: Profile;
  fetchProfile: () => void;
}) {
  const [newProfileInfo, setNewProfileInfo] = useState<formFields>({
    image: undefined,
    name: profile.name,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (
      newProfileInfo.image === undefined &&
      newProfileInfo.name === profile.name
    ) {
      return;
    }

    setLoading(true);

    // Upload image if it exists
    if (newProfileInfo.image!) {
      const { success, error } = await uploadProfileImage(
        newProfileInfo.image!,
        profile.id,
        profile.user_id
      );

      if (!success) {
        console.log(error);
        setLoading(false);
        setMessage({
          type: "error",
          text: error?.message || "Failed to upload profile image",
        });
        return;
      }
    }

    // Update name if it exists
    if (newProfileInfo.name !== profile.name) {
      const { success: updateSuccess, error: updateError } =
        await updateProfile(profile.id, newProfileInfo.name);
      if (!updateSuccess) {
        console.log(updateError);
        setLoading(false);
        setMessage({
          type: "error",
          text: updateError?.message || "Failed to update profile name",
        });
        return;
      }
    }

    // Refetch profile
    await fetchProfile();

    setLoading(false);
    setMessage({
      type: "success",
      text: "Profile updated successfully",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Here, you can view and edit your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Image */}
              <div className="flex flex-col gap-2 ">
                <div
                  className="relative flex items-center justify-center h-36 w-36 rounded-full bg-black/10 shadow-xl border-4 border-primary cursor-pointer hover:bg-black/20 transition-colors duration-200"
                  onClick={() =>
                    document.getElementById("profile-image-input")?.click()
                  }
                >
                  {newProfileInfo.image || profile.image_url ? (
                    <img
                      src={
                        newProfileInfo.image
                          ? URL.createObjectURL(newProfileInfo.image)
                          : profile.image_url!
                      }
                      alt="Profile"
                      width={800}
                      height={800}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="h-20 w-20" />
                  )}
                  <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2">
                    <Edit className="h-4 w-4" />
                  </div>
                </div>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setNewProfileInfo({
                      ...newProfileInfo,
                      image: e.target.files?.[0],
                    })
                  }
                />
              </div>
              {/* Text Inputs */}
              <div className="flex-1 min-h-0 w-full flex flex-col gap-4">
                <div className="flex flex-col">
                  <label htmlFor="name">Name</label>
                  <Input
                    required
                    type="text"
                    name="name"
                    id="name"
                    value={newProfileInfo.name}
                    placeholder="Enter your name"
                    minLength={3}
                    maxLength={25}
                    onChange={(e) =>
                      setNewProfileInfo({
                        ...newProfileInfo,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="email">
                    Email{" "}
                    <span className="text-muted-foreground">
                      (Cannot be changed)
                    </span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={profile.email}
                    disabled
                  />
                </div>
              </div>
            </div>
            {message && (
              <p
                className={
                  message.type === "success" ? "text-green-500" : "text-red-500"
                }
              >
                {message.text}
              </p>
            )}
            <Button
              disabled={
                loading ||
                (newProfileInfo.name === profile.name &&
                  !newProfileInfo.image) ||
                newProfileInfo.name.length < 3 ||
                newProfileInfo.name.length > 25
              }
              type="submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ProfileCard;
