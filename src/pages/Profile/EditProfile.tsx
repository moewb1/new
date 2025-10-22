import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EditProfile.module.css";
import colors from "@/styles/colors";
import { createOrUpdateProfile } from "@/services/profileService";
import { buildProfileSubmissionPayload } from "@/utils/profileSubmission";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLanguages } from "@/store/slices/metaSlice";

type Profile = {
  role?: "provider" | "consumer";
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
  profilePhoto?: string;
  fullBodyPhoto?: string;
  standingPhoto?: string;
  sittingPhoto?: string;
  galleryPhotos?: string[];
  preferredLanguage?: string;
  preferredLanguageIds?: number[];
};

const MAX_GALLERY_PHOTOS = 12;

async function fileToDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function filesToDataUrls(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const urls = await Promise.all(files.map((file) => fileToDataUrl(file)));
  return urls.filter((url): url is string => Boolean(url));
}

export default function EditProfile() {
  const navigate = useNavigate();

  const storedProfile = useMemo<Profile>(() => {
    try { return JSON.parse(localStorage.getItem("profile") || "{}"); }
    catch { return {}; }
  }, []);

  const storedIdentity = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kyc.identity") || "{}"); }
    catch { return {}; }
  }, []);

  const dispatch = useAppDispatch();
  const languagesState = useAppSelector((state) => state.meta.languages);
  const languageOptions = useMemo(() => {
    return (languagesState.data || []).map((lang) => ({
      id: lang.id,
      label: lang.name || lang.code || `Language ${lang.id}`,
    }));
  }, [languagesState.data]);
  const storedProfileLanguageIds = Array.isArray(storedProfile.preferredLanguageIds)
    ? storedProfile.preferredLanguageIds
    : [];
  const storedIdentityLanguageIds = Array.isArray(
    (storedIdentity as Record<string, unknown>).preferredLanguageIds
  )
    ? ((storedIdentity as Record<string, unknown>).preferredLanguageIds as number[])
    : [];
  const storedPreferredLanguageName = useMemo(() => {
    const profileLang = (storedProfile.preferredLanguage || "") as string;
    const identityLang = (storedIdentity.preferredLanguage || "") as string;
    return (profileLang || identityLang || "").trim();
  }, [storedIdentity.preferredLanguage, storedProfile.preferredLanguage]);
  const initialPreferredLanguageId = useMemo(() => {
    const fromProfile = storedProfileLanguageIds.find((id) => typeof id === "number");
    if (typeof fromProfile === "number") return fromProfile;
    const fromIdentity = storedIdentityLanguageIds.find((id) => typeof id === "number");
    return typeof fromIdentity === "number" ? fromIdentity : null;
  }, [storedIdentityLanguageIds, storedProfileLanguageIds]);

  const role = storedProfile.role;
  const isProvider = role === "provider";

  const [firstName, setFirstName] = useState(storedProfile.firstName || "");
  const [lastName, setLastName]   = useState(storedProfile.lastName || "");
  const [phone, setPhone]         = useState(storedProfile.phone || storedIdentity.phone || "");
  const [email, setEmail]         = useState(storedProfile.email || "");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(storedProfile.profilePhoto);
  const [fullBodyPhoto, setFullBodyPhoto] = useState<string | undefined>(storedProfile.fullBodyPhoto);
  const [sittingPhoto, setSittingPhoto] = useState<string | undefined>(storedProfile.sittingPhoto);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(
    Array.isArray(storedProfile.galleryPhotos) ? storedProfile.galleryPhotos : []
  );
  const [preferredLanguageId, setPreferredLanguageId] = useState<number | null>(
    initialPreferredLanguageId
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [galleryLimitMessage, setGalleryLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    // hydration for "name" preview if only "name" existed
    if (!firstName && !lastName && storedProfile.name) {
      const [fn, ...rest] = storedProfile.name.split(" ");
      setFirstName(fn || "");
      setLastName(rest.join(" ").trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (languagesState.status === "idle") {
      dispatch(fetchLanguages());
    }
  }, [dispatch, languagesState.status]);

  useEffect(() => {
    if (
      typeof preferredLanguageId !== "number" &&
      languageOptions.length > 0 &&
      storedPreferredLanguageName
    ) {
      const match = languageOptions.find(
        (opt) => opt.label.toLowerCase() === storedPreferredLanguageName.toLowerCase()
      );
      if (match) {
        setPreferredLanguageId(match.id);
      }
    }
  }, [languageOptions, preferredLanguageId, storedPreferredLanguageName]);

  const emailOk = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const phoneOk = useMemo(() => {
    if (!phone) return false;
    // Simple sanity check (allow +, digits, spaces, dashes, parentheses)
    const raw = phone.replace(/[^\d+]/g, "");
    return /^\+?\d{7,15}$/.test(raw);
  }, [phone]);

  const firstOk = (firstName || "").trim().length >= 2;
  const lastOk  = (lastName || "").trim().length >= 2;
  const profilePhotoOk = Boolean(profilePhoto);
  const fullBodyOk = isProvider ? Boolean(fullBodyPhoto) : true;
  const sittingPhotoOk = isProvider ? Boolean(sittingPhoto) : true;
  const languageOk = isProvider ? typeof preferredLanguageId === "number" : true;
  const galleryLimitOk = galleryPhotos.length <= MAX_GALLERY_PHOTOS;
  const allOk =
    firstOk &&
    lastOk &&
    phoneOk &&
    emailOk &&
    profilePhotoOk &&
    fullBodyOk &&
    sittingPhotoOk &&
    languageOk &&
    galleryLimitOk;

  const handleProfilePhotoChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const fileList = event.target.files;
    const file = fileList && fileList[0];
    event.target.value = "";
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      if (url) {
        setProfilePhoto(url);
      }
    } catch (error) {
      console.error("Failed to read profile photo", error);
      if (typeof window !== "undefined") {
        window.alert("We couldn't read that photo. Please try another file.");
      }
    }
  };

  const clearProfilePhoto = () => {
    setProfilePhoto(undefined);
  };

  const handleFullBodyPhotoChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const fileList = event.target.files;
    const file = fileList && fileList[0];
    event.target.value = "";
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      if (url) {
        setFullBodyPhoto(url);
      }
    } catch (error) {
      console.error("Failed to read full body photo", error);
      if (typeof window !== "undefined") {
        window.alert("We couldn't read that photo. Please try another file.");
      }
    }
  };

  const clearFullBodyPhoto = () => {
    setFullBodyPhoto(undefined);
  };

  const handleSittingPhotoChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const fileList = event.target.files;
    const file = fileList && fileList[0];
    event.target.value = "";
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      if (url) {
        setSittingPhoto(url);
      }
    } catch (error) {
      console.error("Failed to read sitting photo", error);
      if (typeof window !== "undefined") {
        window.alert("We couldn't read that photo. Please try another file.");
      }
    }
  };

  const clearSittingPhoto = () => {
    setSittingPhoto(undefined);
  };

  const handleGalleryChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const available = Math.max(0, MAX_GALLERY_PHOTOS - galleryPhotos.length);
    if (available <= 0) {
      setGalleryLimitMessage(`You can keep up to ${MAX_GALLERY_PHOTOS} photos.`);
      return;
    }

    const selected = files.slice(0, available);
    if (selected.length < files.length) {
      setGalleryLimitMessage(`Only the first ${selected.length} photo${selected.length === 1 ? "" : "s"} were added (max ${MAX_GALLERY_PHOTOS}).`);
    } else {
      setGalleryLimitMessage(null);
    }

    try {
      const urls = await filesToDataUrls(selected);
      if (urls.length) {
        setGalleryPhotos((prev) => {
          const next = [...prev];
          urls.forEach((url) => {
            if (next.length < MAX_GALLERY_PHOTOS && !next.includes(url)) {
              next.push(url);
            }
          });
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to add gallery photos", error);
      if (typeof window !== "undefined") {
        window.alert("We couldn't add one of the photos. Please try again.");
      }
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos((prev) => prev.filter((_, idx) => idx !== index));
    setGalleryLimitMessage(null);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!allOk) return;

    setSaving(true);
    try {
      const cleanFirst = firstName.trim();
      const cleanLast = lastName.trim();
      const cleanPhone = phone.trim();
      const cleanEmail = email.trim();
      const selectedLanguage =
        languageOptions.find((opt) => opt.id === preferredLanguageId) || null;
      const selectedLanguageLabel = selectedLanguage?.label?.trim() || "";

      const next: Profile = {
        ...storedProfile,
        firstName: cleanFirst,
        lastName: cleanLast,
        name: `${cleanFirst} ${cleanLast}`.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        profilePhoto: profilePhoto,
        fullBodyPhoto: isProvider ? fullBodyPhoto : storedProfile.fullBodyPhoto,
        standingPhoto: isProvider ? fullBodyPhoto : storedProfile.standingPhoto,
        sittingPhoto: isProvider ? sittingPhoto : storedProfile.sittingPhoto,
        galleryPhotos: galleryPhotos.length ? galleryPhotos : undefined,
        preferredLanguage: selectedLanguageLabel || undefined,
        preferredLanguageIds: selectedLanguage ? [selectedLanguage.id] : undefined,
      };

      localStorage.setItem("profile", JSON.stringify(next));

      const nextIdentity = {
        ...storedIdentity,
        phone: cleanPhone,
        preferredLanguage: next.preferredLanguage || null,
        preferredLanguageIds: next.preferredLanguageIds || [],
        profilePhotoSet: Boolean(next.profilePhoto),
        fullBodyPhotoSet: Boolean(next.fullBodyPhoto),
        standingPhotoSet: Boolean(next.standingPhoto),
        sittingPhotoSet: Boolean(next.sittingPhoto),
        galleryCount: next.galleryPhotos?.length ?? 0,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("kyc.identity", JSON.stringify(nextIdentity));

      const payload = buildProfileSubmissionPayload({
        requireMedia: true,
      });
      const response = await createOrUpdateProfile(payload);
      if (response && response.success === false) {
        throw new Error(response.message || "We couldn't update your profile on the server.");
      }

      navigate("/home");
    } catch (error) {
      console.error("Failed to save profile", error);
      if (typeof window !== "undefined") {
        const message =
          error instanceof Error
            ? error.message
            : "We couldn't save your profile. Please try again.";
        window.alert(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Edit Profile</h1>
          <p className={styles.sub}>Update your basic details. Changes reflect across the app.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Form */}
        <form className={styles.card} onSubmit={onSave} noValidate>
          <div className={styles.row}>
            <label className={styles.label}>First name</label>
            <input
              className={`${styles.input} ${submitted && !firstOk ? styles.inputError : ""}`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Maya"
              autoComplete="given-name"
              required
            />
            {submitted && !firstOk && <p className={styles.error}>Enter at least 2 characters.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Last name</label>
            <input
              className={`${styles.input} ${submitted && !lastOk ? styles.inputError : ""}`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Khalid"
              autoComplete="family-name"
              required
            />
            {submitted && !lastOk && <p className={styles.error}>Enter at least 2 characters.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Mobile number</label>
            <input
              className={`${styles.input} ${submitted && !phoneOk ? styles.inputError : ""}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 5X XXX XXXX"
              inputMode="tel"
              autoComplete="tel"
              required
            />
            {submitted && !phoneOk && <p className={styles.error}>Enter a valid phone number.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Email</label>
            <input
              className={`${styles.input} ${submitted && !emailOk ? styles.inputError : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
            {submitted && !emailOk && <p className={styles.error}>Enter a valid email address.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Profile photo *</label>
            <div className={styles.mediaRow}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile preview" className={styles.photoPreview} />
              ) : (
                <div className={styles.photoPlaceholder}>No photo</div>
              )}
              <div className={styles.mediaActions}>
                <label className={styles.uploadBtn}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className={styles.fileInput}
                  />
                  {profilePhoto ? "Replace photo" : "Upload photo"}
                </label>
                {profilePhoto && (
                  <button type="button" className={styles.linkAction} onClick={clearProfilePhoto}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className={styles.hint}>Use a clear headshot facing the camera.</p>
            {submitted && !profilePhotoOk && <p className={styles.error}>Profile photo is required.</p>}
          </div>

          {isProvider && (
            <>
              <div className={styles.row}>
                <label className={styles.label}>Standing photo *</label>
                <div className={styles.mediaRow}>
                  {fullBodyPhoto ? (
                    <img src={fullBodyPhoto} alt="Standing photo preview" className={styles.photoPreview} />
                  ) : (
                    <div className={styles.photoPlaceholder}>No photo</div>
                  )}
                  <div className={styles.mediaActions}>
                    <label className={styles.uploadBtn}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFullBodyPhotoChange}
                        className={styles.fileInput}
                      />
                      {fullBodyPhoto ? "Replace photo" : "Upload photo"}
                    </label>
                    {fullBodyPhoto && (
                      <button type="button" className={styles.linkAction} onClick={clearFullBodyPhoto}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className={styles.hint}>Show a full-length standing photo so clients can see your presence.</p>
                {submitted && !fullBodyOk && (
                  <p className={styles.error}>Standing photo is required for providers.</p>
                )}
              </div>

              <div className={styles.row}>
                <label className={styles.label}>Sitting photo *</label>
                <div className={styles.mediaRow}>
                  {sittingPhoto ? (
                    <img src={sittingPhoto} alt="Sitting photo preview" className={styles.photoPreview} />
                  ) : (
                    <div className={styles.photoPlaceholder}>No photo</div>
                  )}
                  <div className={styles.mediaActions}>
                    <label className={styles.uploadBtn}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSittingPhotoChange}
                        className={styles.fileInput}
                      />
                      {sittingPhoto ? "Replace photo" : "Upload photo"}
                    </label>
                    {sittingPhoto && (
                      <button type="button" className={styles.linkAction} onClick={clearSittingPhoto}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className={styles.hint}>Provide a seated photo to support your verification.</p>
                {submitted && !sittingPhotoOk && (
                  <p className={styles.error}>Sitting photo is required for providers.</p>
                )}
              </div>
            </>
          )}

          <div className={styles.row}>
            <label className={styles.label}>
              Preferred language{isProvider ? " *" : " (optional)"}
            </label>
            <select
              className={`${styles.input} ${(isProvider && submitted && !languageOk) ? styles.inputError : ""}`}
              value={typeof preferredLanguageId === "number" ? preferredLanguageId.toString() : ""}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setPreferredLanguageId(null);
                } else {
                  setPreferredLanguageId(Number(value));
                }
              }}
              disabled={languageOptions.length === 0}
            >
              <option value="">
                {languagesState.status === "loading" ? "Loading languages…" : "Select language…"}
              </option>
              {languageOptions.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
            {languagesState.status === "failed" ? (
              <p className={styles.error}>Unable to load languages. Please try again shortly.</p>
            ) : isProvider ? (
              submitted && !languageOk ? (
                <p className={styles.error}>Preferred language is required for providers.</p>
              ) : (
                <p className={styles.hint}>Clients will see this on your public profile.</p>
              )
            ) : (
              <p className={styles.hint}>Optional: helps us communicate with you.</p>
            )}
          </div>

          {isProvider && (
            <div className={styles.row}>
              <label className={styles.label}>Additional gallery (optional)</label>
              <div className={styles.mediaRow}>
                <div className={styles.galleryWrap}>
                  {galleryPhotos.length === 0 ? (
                    <div className={styles.photoPlaceholder}>No photos yet</div>
                  ) : (
                    <div className={styles.galleryGrid}>
                      {galleryPhotos.map((photo, idx) => (
                        <div key={`${photo.slice(0,20)}-${idx}`} className={styles.galleryItem}>
                          <img src={photo} alt={`Gallery ${idx + 1}`} className={styles.galleryImg} />
                          <button
                            type="button"
                            className={styles.galleryRemove}
                            onClick={() => removeGalleryPhoto(idx)}
                            aria-label="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.mediaActions}>
                  <label className={styles.uploadBtn}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryChange}
                      className={styles.fileInput}
                    />
                    Add photos
                  </label>
                  <span className={styles.hintSmall}>
                    {galleryPhotos.length}/{MAX_GALLERY_PHOTOS} stored
                  </span>
                </div>
              </div>
              {galleryLimitMessage ? <p className={styles.hint}>{galleryLimitMessage}</p> : null}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => navigate("/home")}>
              Cancel
            </button>
            <button
              className={styles.primary}
              style={{ background: colors.accent, color: colors.white, opacity: allOk && !saving ? 1 : 0.6 }}
              disabled={!allOk || saving}
              type="submit"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
