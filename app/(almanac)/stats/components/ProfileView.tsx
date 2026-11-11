"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { CheckIcon, CrossIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import type { SessionUser } from "@/components/almanac/SessionProvider";
import { SubjectToggle } from "@/components/almanac/SubjectToggle";
import { TextField } from "@/components/almanac/TextField";
import { SUBJECTS, almanac, joinList, useAlmanac, type Subject } from "@/lib/almanac";
import { authService } from "@/lib/auth";
import { updateProfile, uploadProfileImage } from "@/lib/profiles";

const NAME_MAX = 25;
const LEGEND = "t-label p-0";
const AVATAR = "h-24 w-24 rounded-(--radius-full)";

type SaveState = "idle" | "saving" | "saved" | "failed";

/** A photo picked in this visit. `file` is cleared once it has been saved. */
type Photo = { url: string; file: File | null };

export function ProfileView({ user }: { user: SessionUser }) {
  const router = useRouter();
  const subjects = useAlmanac(() => almanac.getSubjects(), []);
  const [name, setName] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Subject[] | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [notAnImage, setNotAnImage] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [failure, setFailure] = useState({ message: "", retry: true });
  const [signingOut, setSigningOut] = useState(false);

  // Free the preview when it is replaced or the page is left.
  const previewUrl = photo?.url;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const currentName = name ?? user.name;
  const picked = chosen ?? subjects.data ?? [];
  const initial = (currentName.trim() || user.email)[0]?.toUpperCase();
  const saving = save === "saving";

  const onPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Lets the same file be picked again after a change of mind.
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotAnImage(true);
      return;
    }
    setNotAnImage(false);
    setPhoto({ url: URL.createObjectURL(file), file });
    setSave("idle");
  };

  const toggle = (subject: Subject) => {
    setChosen(picked.includes(subject) ? picked.filter((s) => s !== subject) : [...picked, subject]);
    setSave("idle");
  };

  const saveChanges = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSave("saving");

    const trimmed = currentName.trim();
    const file = photo?.file ?? null;
    const wantsName = trimmed !== user.name;
    const failed: string[] = [];
    let tried = 0;
    let accountChanged = false;

    if (chosen) {
      tried += 1;
      try {
        await almanac.saveSubjects(chosen);
        subjects.setData(chosen);
        setChosen(null);
      } catch {
        failed.push("subjects");
      }
    }

    // The name and photo are kept on the profile row. Without one there is nowhere to put them.
    const profileId = user.profileId;
    if (!profileId && (wantsName || file)) {
      const parts = joinList([wantsName && "name", file && "photo"].filter((part): part is string => Boolean(part)));
      const rest = chosen ? (failed.length ? " Your subjects didn’t save either." : " Your subjects were saved.") : "";
      setFailure({
        message: `Your ${parts} can’t be saved, because this account has no profile to keep ${wantsName && file ? "them" : "it"} in.${rest}`,
        retry: false,
      });
      setSave("failed");
      return;
    }

    if (profileId && wantsName) {
      tried += 1;
      const result = await updateProfile(profileId, trimmed).catch(() => ({ success: false }));
      if (result.success) accountChanged = true;
      else failed.push("name");
    }

    if (profileId && file) {
      tried += 1;
      const result = await uploadProfileImage(file, profileId, user.id).catch(() => ({ success: false }));
      if (result.success) {
        accountChanged = true;
        // Keep showing it, unless another photo was picked while this one was saving.
        setPhoto((current) => (current?.file === file ? { url: current.url, file: null } : current));
      } else {
        failed.push("photo");
      }
    }

    // The masthead reads the name and photo from the server.
    if (accountChanged) router.refresh();

    if (failed.length === 0) {
      setSave("saved");
      return;
    }
    setFailure({
      message:
        failed.length === tried
          ? "Couldn’t save. Your changes are still here. Try again."
          : `Couldn’t save your ${joinList(failed)}. The rest is saved. Try again.`,
      retry: true,
    });
    setSave("failed");
  };

  const signOut = async () => {
    setSigningOut(true);
    await authService.signOut();
    window.location.assign("/");
  };

  return (
    <form
      noValidate
      onSubmit={saveChanges}
      className="mt-6 max-w-[720px] border-0 border-t-[3px] border-solid border-(--ink) pt-5 md:mt-10"
    >
      <fieldset className="m-0 border-0 p-0">
        <legend className={LEGEND}>Photo</legend>
        <div className="mt-3 flex flex-wrap items-center gap-[18px]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.url}
              alt={photo.file ? "Preview of your new photo" : "Your photo"}
              className={cx(
                AVATAR,
                "flex-none object-cover",
                photo.file && "outline-2 outline-offset-[3px] outline-dashed outline-(--accent)"
              )}
            />
          ) : user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="Your photo" className={cx(AVATAR, "flex-none object-cover")} />
          ) : (
            <span
              aria-hidden="true"
              className={cx(
                AVATAR,
                "flex flex-none items-center justify-center bg-(--ink) text-[44px] font-medium text-(--on-ink)"
              )}
            >
              {initial}
            </span>
          )}
          <div className="min-w-0">
            {/* The input comes first so the label can show its focus ring. */}
            <input id="profile-photo" type="file" accept="image/*" onChange={onPhoto} className="peer sr-only" />
            <label
              htmlFor="profile-photo"
              className="inline-flex min-h-[46px] cursor-pointer items-center border-[1.5px] border-solid border-(--ink) px-4 font-mono text-[13px] hover:bg-(--paper-sunk) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus)"
            >
              {photo || user.imageUrl ? "Choose a different photo" : "Upload a photo"}
            </label>
            {notAnImage ? (
              <p role="alert" className="m-0 mt-2 flex items-center gap-[6px] text-[15px] text-(--incorrect)">
                <CrossIcon size={14} className="flex-none" />
                That file isn’t a picture. Choose a photo instead.
              </p>
            ) : (
              <p className="t-note m-0 mt-2 text-(--ink-muted)">
                {photo
                  ? photo.file
                    ? "Preview. Save to use it."
                    : "Saved. This is your photo now."
                  : user.imageUrl
                    ? "This is your photo."
                    : "No photo yet, so your initial is shown."}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <div className="mt-[26px] flex flex-wrap gap-5">
        <div className="min-w-0 flex-[1_1_280px]">
          <TextField
            label="Name"
            name="name"
            autoComplete="name"
            maxLength={NAME_MAX}
            help="Shown in the account menu"
            value={currentName}
            onValueChange={(value) => {
              setName(value.slice(0, NAME_MAX));
              setSave("idle");
            }}
          />
        </div>
        <div className="min-w-0 flex-[1_1_280px]">
          <TextField label="Email · can’t be changed" type="email" readOnly value={user.email} />
        </div>
      </div>

      <fieldset className="m-0 mt-[26px] border-0 p-0">
        <legend className={LEGEND}>Subjects for your daily lesson</legend>
        {subjects.error ? (
          <Notice
            className="mt-3"
            tone="error"
            kicker="Couldn’t load"
            title="Your subjects didn’t load."
            body="It’s probably the connection. Nothing was lost."
            primary={{ label: "Try again", onClick: subjects.reload }}
            secondary={{ label: "Go to Today", href: "/today" }}
          />
        ) : subjects.data ? (
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {SUBJECTS.map((subject) => (
              <SubjectToggle key={subject} name={subject} on={picked.includes(subject)} onToggle={() => toggle(subject)} />
            ))}
          </div>
        ) : (
          <div aria-busy="true" className="mt-3 h-[52px] bg-(--paper-sunk)" />
        )}
      </fieldset>

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-[14px] border-0 border-t border-solid border-(--rule) pt-[18px]">
        <Button type="submit" size="large" busy={saving}>
          {saving ? "Saving" : save === "failed" && failure.retry ? "Try saving again" : "Save changes"}
        </Button>
        {/* The status region stays mounted so "Saved" is announced when it arrives. */}
        <div className="min-w-0">
          <p role="status" className="m-0 flex items-center gap-[6px] font-mono text-[13px] text-(--correct)">
            {save === "saved" && (
              <>
                <CheckIcon size={13} strokeWidth={2.6} />
                Saved
              </>
            )}
          </p>
          {save === "failed" && (
            <p
              role="alert"
              className="m-0 flex items-start gap-[6px] bg-(--incorrect-wash) px-3 py-[10px] text-[16px] leading-[1.4] text-(--ink)"
            >
              <CrossIcon size={14} strokeWidth={2.6} className="mt-1 flex-none text-(--incorrect)" />
              {failure.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 border-0 border-t border-solid border-(--rule) pt-[18px]">
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="min-h-11 cursor-pointer border-0 bg-transparent p-0 font-mono text-[13px] text-(--ink) underline underline-offset-4"
        >
          {signingOut ? "Signing out" : "Sign out"}
        </button>
      </div>
    </form>
  );
}
