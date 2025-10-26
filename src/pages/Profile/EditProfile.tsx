import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select, { type StylesConfig } from "react-select";
import styles from "./EditProfile.module.css";
import colors from "@/styles/colors";
import {
  createOrUpdateProfile,
  fetchProfile,
  type CreateProfileRequest,
  type PersonType,
} from "@/services/profileService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchLanguages,
  fetchNationalities,
  fetchServices,
  type Language,
  type Nationality,
  type Service,
} from "@/store/slices/metaSlice";
import { useProfile } from "@/hooks/useProfile";

type Option = { value: number; label: string };
type CountryOption = Option & { code: string };

const baseSelectControl = (base: any) => ({
  ...base,
  borderRadius: 12,
  borderColor: "rgba(0,0,0,0.16)",
  minHeight: 44,
  fontWeight: 600,
  ":hover": { borderColor: "rgba(0,0,0,0.3)" },
});

const selectStyles: StylesConfig<Option, false> = {
  control: baseSelectControl,
};

const countrySelectStyles: StylesConfig<CountryOption, false> = {
  control: baseSelectControl,
};

const multiSelectStyles: StylesConfig<Option, true> = {
  control: baseSelectControl,
  valueContainer: (base) => ({ ...base, flexWrap: "wrap", gap: 4 }),
  multiValue: (base) => ({
    ...base,
    borderRadius: 10,
    background: "rgba(169,174,155,0.14)",
    border: "1px solid rgba(169,174,155,0.35)",
    fontWeight: 600,
  }),
};

async function fileToDataUrl(file: File | null): Promise<string | null> {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function parseFloatOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { profile, status: profileStatus, error: profileError, refresh } = useProfile();

  const servicesState = useAppSelector((state) => state.meta.services);
  const languagesState = useAppSelector((state) => state.meta.languages);
  const nationalitiesState = useAppSelector((state) => state.meta.nationalities);

  useEffect(() => {
    if (servicesState.status === "idle") dispatch(fetchServices());
    if (languagesState.status === "idle") dispatch(fetchLanguages());
    if (nationalitiesState.status === "idle") dispatch(fetchNationalities());
  }, [dispatch, servicesState.status, languagesState.status, nationalitiesState.status]);

  const serviceOptions = useMemo<Option[]>(
    () => (servicesState.data || []).map((service) => ({ value: service.id, label: service.name })),
    [servicesState.data]
  );

  const languageOptions = useMemo<Option[]>(
    () =>
      (languagesState.data || []).map((language: Language) => ({
        value: language.id,
        label: language.name || language.code || `Language ${language.id}`,
      })),
    [languagesState.data]
  );

  const nationalityOptions = useMemo<CountryOption[]>(
    () =>
      (nationalitiesState.data || []).map((nat: Nationality) => ({
        value: nat.id,
        label: nat.name,
        code: nat.code || "",
      })),
    [nationalitiesState.data]
  );

  const [role, setRole] = useState<"provider" | "consumer">("consumer");
  const [personType, setPersonType] = useState<PersonType>("individual");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+971");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState<string>("");
  const [bio, setBio] = useState("");
  const [nationalityId, setNationalityId] = useState<number | null>(null);

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressStateField, setAddressStateField] = useState("");
  const [addressBuilding, setAddressBuilding] = useState("");
  const [addressApartment, setAddressApartment] = useState("");
  const [addressCountryCode, setAddressCountryCode] = useState("AE");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressLatitude, setAddressLatitude] = useState("");
  const [addressLongitude, setAddressLongitude] = useState("");

  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");

  const [selectedServices, setSelectedServices] = useState<Option[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<Option[]>([]);

  const [kycDocType, setKycDocType] = useState<string>("personal_id");
  const [kycExistingName, setKycExistingName] = useState<string | null>(null);
  const [kycFile, setKycFile] = useState<File | null>(null);

  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const [standingPreview, setStandingPreview] = useState<string | null>(null);
  const [standingFile, setStandingFile] = useState<File | null>(null);

  const [sittingPreview, setSittingPreview] = useState<string | null>(null);
  const [sittingFile, setSittingFile] = useState<File | null>(null);

  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryLimitMessage, setGalleryLimitMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProvider = role === "provider";

  useEffect(() => {
    if (!profile) return;
    const { user } = profile;

    setRole((user.role as "provider" | "consumer") || "consumer");
    setPersonType((user.type as PersonType) || "individual");

    setFirstName(user.fname || "");
    setLastName(user.lname || "");
    setEmail(user.email || "");
    setDialCode(user.dial_code || "+971");
    setPhoneNumber(user.phone_number || "");
    setDob(user.dob || "");
    setBio(user.bio || "");
    setNationalityId(user.nationality?.id ?? null);

    const primaryAddress = user.addresses?.[0];
    if (primaryAddress) {
      setAddressLine1(primaryAddress.line1 || "");
      setAddressLine2(primaryAddress.line2 || "");
      setAddressCity(primaryAddress.city || "");
      setAddressStateField(primaryAddress.state || "");
      setAddressBuilding(primaryAddress.building || "");
      setAddressApartment(primaryAddress.apartment || "");
      setAddressCountryCode(primaryAddress.country_code || "AE");
      setAddressPostalCode(primaryAddress.postal_code || "");
      setAddressLatitude(primaryAddress.latitude ? String(primaryAddress.latitude) : "");
      setAddressLongitude(primaryAddress.longitude ? String(primaryAddress.longitude) : "");
    }

    if (user.bank_account) {
      setIban(user.bank_account.iban || "");
      setBankName(user.bank_account.bank_name || "");
      setBankAccountHolder(user.bank_account.account_holder_name || "");
    } else {
      setIban("");
      setBankName("");
      setBankAccountHolder("");
    }

    if (Array.isArray(user.language_ids) && user.language_ids.length > 0) {
      setSelectedLanguages(
        (languageOptions || []).filter((opt) => user.language_ids?.includes(opt.value))
      );
    } else if (languageOptions.length > 0) {
      setSelectedLanguages([]);
    }

    if (Array.isArray(user.service_ids) && user.service_ids.length > 0) {
      setSelectedServices(
        (serviceOptions || []).filter((opt) => user.service_ids?.includes(opt.value))
      );
    } else {
      setSelectedServices([]);
    }

    const profileImage =
      user.images?.find((img) => img.slug === "profile_picture") ?? user.images?.[0];
    setProfilePicturePreview(profileImage?.normal_url || null);
    setProfilePictureFile(null);

    const standingImage = user.images?.find((img) => img.slug === "standing_photo");
    setStandingPreview(standingImage?.normal_url || null);
    setStandingFile(null);

    const sittingImage = user.images?.find((img) => img.slug === "sitting_photo");
    setSittingPreview(sittingImage?.normal_url || null);
    setSittingFile(null);

    if (Array.isArray(user.kyc_documents) && user.kyc_documents.length > 0) {
      const doc = user.kyc_documents[0];
      setKycDocType(doc.doc_type || "personal_id");
      const path = doc.path || "";
      const name = path.split("/").pop() || "document";
      setKycExistingName(name);
    } else {
      setKycDocType("personal_id");
      setKycExistingName(null);
    }

    setGalleryPhotos([]);
    setGalleryLimitMessage(null);
  }, [profile, languageOptions, serviceOptions]);

  const handleProfilePictureChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const preview = await fileToDataUrl(file);
    setProfilePictureFile(file);
    setProfilePicturePreview(preview);
  };

  const handleStandingChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const preview = await fileToDataUrl(file);
    setStandingFile(file);
    setStandingPreview(preview);
  };

  const handleSittingChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const preview = await fileToDataUrl(file);
    setSittingFile(file);
    setSittingPreview(preview);
  };

  const handleKycFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setKycFile(file);
    setKycExistingName(file.name);
  };

  const handleGalleryChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const MAX_GALLERY_PHOTOS = 12;
    const available = Math.max(0, MAX_GALLERY_PHOTOS - galleryPhotos.length);
    if (available <= 0) {
      setGalleryLimitMessage(`You can keep up to ${MAX_GALLERY_PHOTOS} photos.`);
      return;
    }

    const selected = files.slice(0, available);
    if (selected.length < files.length) {
      setGalleryLimitMessage(
        `Only the first ${selected.length} photo${selected.length === 1 ? "" : "s"} were added (max ${MAX_GALLERY_PHOTOS}).`
      );
    } else {
      setGalleryLimitMessage(null);
    }

    try {
      const urls = await Promise.all(selected.map((file) => fileToDataUrl(file)));
      const filtered = urls.filter((url): url is string => Boolean(url));
      setGalleryPhotos((prev) => [...prev, ...filtered]);
    } catch (error) {
      console.error("Failed to add gallery photos", error);
      window.alert("We couldn't add one of the photos. Please try again.");
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos((prev) => prev.filter((_, idx) => idx !== index));
    setGalleryLimitMessage(null);
  };

  const validate = (): boolean => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false;
    if (!dialCode.trim() || !phoneNumber.trim()) return false;
    if (!addressLine1.trim()) return false;
    if (!nationalityId) return false;
    if (isProvider && selectedLanguages.length === 0) return false;
    if (isProvider && selectedServices.length === 0) return false;
    if (isProvider && (!standingPreview && !standingFile)) return false;
    if (isProvider && (!sittingPreview && !sittingFile)) return false;
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setSuccessMessage(null);
    setSubmitError(null);
    if (!validate()) return;

    const payload: CreateProfileRequest = {
      type: isProvider ? "provider" : "consumer",
      profile: {
        fname: firstName.trim(),
        lname: lastName.trim(),
        dob: dob || "",
        email: email.trim(),
        dial_code: dialCode.trim(),
        phone_number: phoneNumber.trim(),
        type: personType,
        bio: bio.trim() || null,
        nationality_id: nationalityId ?? 0,
      },
      address: {
        line1: addressLine1.trim(),
        line2: addressLine2.trim() || null,
        city: addressCity.trim(),
        state: addressStateField.trim() || null,
        building: addressBuilding.trim() || null,
        apartment: addressApartment.trim() || null,
        country_code: addressCountryCode.trim() || "AE",
        postal_code: addressPostalCode.trim() || null,
        latitude: parseFloatOrNull(addressLatitude),
        longitude: parseFloatOrNull(addressLongitude),
        active: 1,
      },
      kyc_doc_type: kycDocType || "personal_id",
    };

    const languageIds = selectedLanguages.map((opt) => opt.value);
    if (languageIds.length > 0) {
      payload.language_ids = languageIds;
    }

    const serviceIds = selectedServices.map((opt) => opt.value);
    if (serviceIds.length > 0) {
      payload.service_ids = serviceIds;
    }

    if (iban.trim() && bankName.trim() && bankAccountHolder.trim()) {
      payload.bank_account = {
        iban: iban.trim(),
        bank_name: bankName.trim(),
        account_holder_name: bankAccountHolder.trim(),
      };
    }

    if (profilePictureFile) {
      payload.profile_picture_img = profilePictureFile;
    }
    if (isProvider && standingFile) {
      payload.standing_img = standingFile;
    }
    if (isProvider && sittingFile) {
      payload.sitten_img = sittingFile;
    }
    if (kycFile) {
      payload.kyc_document = kycFile;
    }

    setLoading(true);
    try {
      await createOrUpdateProfile(payload);

      try {
        const data = await fetchProfile();
        const { user } = data;

        const nextProfile = {
          id: user.id,
          role: user.role ?? (isProvider ? "provider" : "consumer"),
          firstName: user.fname,
          lastName: user.lname,
          email: user.email,
          phone: `${user.dial_code || ""} ${user.phone_number || ""}`.trim(),
          dialCode: user.dial_code,
          phoneNumber: user.phone_number,
          profilePhoto: profilePicturePreview,
          standingPhoto: standingPreview,
          sittingPhoto: sittingPreview,
          preferredLanguageIds: payload.language_ids,
        };
        localStorage.setItem("profile", JSON.stringify(nextProfile));

        const nextIdentity = {
          phone: `${user.dial_code || ""}${user.phone_number || ""}`,
          preferredLanguageIds: payload.language_ids ?? [],
          preferredLanguages: selectedLanguages.map((opt) => opt.label),
          nationalityId: nationalityId,
          nationalityCode:
            nationalityOptions.find((opt) => opt.value === nationalityId)?.code ?? null,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("kyc.identity", JSON.stringify(nextIdentity));

        if (payload.bank_account) {
          localStorage.setItem(
            "bank",
            JSON.stringify({
              ...payload.bank_account,
              savedAt: new Date().toISOString(),
            })
          );
        }
      } catch {
        // Ignore caching errors; not critical for profile update
      }

      setSuccessMessage("Profile updated successfully.");
      setSubmitted(false);
      setKycFile(null);
      setProfilePictureFile(null);
      setStandingFile(null);
      setSittingFile(null);
      refresh();
    } catch (error) {
      console.error("Failed to update profile", error);
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't update your profile. Please try again.";
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile && (profileStatus === "idle" || profileStatus === "loading")) {
    return (
      <section className={styles.wrapper}>
        <p className={styles.info}>Loading profile…</p>
      </section>
    );
  }

  if (profileError) {
    return (
      <section className={styles.wrapper}>
        <p className={styles.error}>{profileError}</p>
        <button className={styles.primary} onClick={() => refresh()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <div>
          <h1 className={styles.h1}>Edit Profile</h1>
          <p className={styles.sub}>Update your details and keep your account up to date.</p>
        </div>
      </header>

      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        {successMessage ? <p className={styles.success}>{successMessage}</p> : null}
        {submitError ? <p className={styles.error}>{submitError}</p> : null}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal information</h2>
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              First name *
              <input
                className={`${styles.input} ${
                  submitted && !firstName.trim() ? styles.inputError : ""
                }`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </label>
            <label className={styles.label}>
              Last name *
              <input
                className={`${styles.input} ${
                  submitted && !lastName.trim() ? styles.inputError : ""
                }`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </label>
          </div>

          <div className={styles.gridTwo}>
            <label className={styles.label}>
              Email *
              <input
                className={`${styles.input} ${
                  submitted &&
                  (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                    ? styles.inputError
                    : ""
                }`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <div className={styles.label}>
              <span>Mobile *</span>
              <div className={styles.phoneRow}>
                <input
                  className={`${styles.input} ${styles.dial}`}
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                />
                <input
                  className={`${styles.input} ${styles.phone}`}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              {submitted && (!dialCode.trim() || !phoneNumber.trim()) ? (
                <p className={styles.error}>Enter your dial code and phone number.</p>
              ) : null}
            </div>
          </div>

          <div className={styles.gridTwo}>
            <label className={styles.label}>
              Date of birth
              <input
                className={styles.input}
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              Account type
              <div className={styles.segment}>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${
                    personType === "individual" ? styles.active : ""
                  }`}
                  onClick={() => setPersonType("individual")}
                >
                  Individual
                </button>
                <button
                  type="button"
                  className={`${styles.segmentBtn} ${
                    personType === "company" ? styles.active : ""
                  }`}
                  onClick={() => setPersonType("company")}
                >
                  Company
                </button>
              </div>
            </label>
          </div>

          <label className={styles.label}>
            Nationality *
            <Select<CountryOption, false>
              styles={countrySelectStyles}
              options={nationalityOptions}
              value={
                nationalityId
                  ? nationalityOptions.find((opt) => opt.value === nationalityId) || null
                  : null
              }
              onChange={(option) => setNationalityId(option ? option.value : null)}
              placeholder={
                nationalitiesState.status === "loading" ? "Loading…" : "Select nationality"
              }
              isLoading={nationalitiesState.status === "loading"}
              isDisabled={nationalityOptions.length === 0}
            />
            {submitted && !nationalityId ? (
              <p className={styles.error}>Select your nationality.</p>
            ) : null}
          </label>

          <label className={styles.label}>
            Bio
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Share a short summary about yourself."
            />
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Address</h2>
          <label className={styles.label}>
            Address line 1 *
            <input
              className={`${styles.input} ${
                submitted && !addressLine1.trim() ? styles.inputError : ""
              }`}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Address line 2
            <input
              className={styles.input}
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </label>

          <div className={styles.gridThree}>
            <label className={styles.label}>
              City
              <input
                className={styles.input}
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              State
              <input
                className={styles.input}
                value={addressStateField}
                onChange={(e) => setAddressStateField(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Postal code
              <input
                className={styles.input}
                value={addressPostalCode}
                onChange={(e) => setAddressPostalCode(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.gridThree}>
            <label className={styles.label}>
              Building
              <input
                className={styles.input}
                value={addressBuilding}
                onChange={(e) => setAddressBuilding(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Apartment
              <input
                className={styles.input}
                value={addressApartment}
                onChange={(e) => setAddressApartment(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Country code
              <input
                className={styles.input}
                value={addressCountryCode}
                onChange={(e) => setAddressCountryCode(e.target.value.toUpperCase())}
              />
            </label>
          </div>

          <div className={styles.gridTwo}>
            <label className={styles.label}>
              Latitude
              <input
                className={styles.input}
                value={addressLatitude}
                onChange={(e) => setAddressLatitude(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Longitude
              <input
                className={styles.input}
                value={addressLongitude}
                onChange={(e) => setAddressLongitude(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Media & documents</h2>

          <div className={styles.mediaRow}>
            <label className={styles.label}>
              Profile photo *
              <div className={styles.mediaBlock}>
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile preview" className={styles.photoPreview} />
                ) : (
                  <div className={styles.photoPlaceholder}>No photo</div>
                )}
                <div className={styles.mediaActions}>
                  <label className={styles.uploadBtn}>
                    <input type="file" accept="image/*" onChange={handleProfilePictureChange} />
                    {profilePicturePreview ? "Replace photo" : "Upload photo"}
                  </label>
                </div>
              </div>
              {submitted && !profilePicturePreview && !profilePictureFile ? (
                <p className={styles.error}>Profile photo is required.</p>
              ) : null}
            </label>

            {isProvider ? (
              <>
                <label className={styles.label}>
                  Standing photo *
                  <div className={styles.mediaBlock}>
                    {standingPreview ? (
                      <img src={standingPreview} alt="Standing preview" className={styles.photoPreview} />
                    ) : (
                      <div className={styles.photoPlaceholder}>No photo</div>
                    )}
                    <div className={styles.mediaActions}>
                      <label className={styles.uploadBtn}>
                        <input type="file" accept="image/*" onChange={handleStandingChange} />
                        {standingPreview ? "Replace photo" : "Upload photo"}
                      </label>
                    </div>
                  </div>
                  {submitted && !standingPreview && !standingFile ? (
                    <p className={styles.error}>Standing photo is required for providers.</p>
                  ) : null}
                </label>

                <label className={styles.label}>
                  Sitting photo *
                  <div className={styles.mediaBlock}>
                    {sittingPreview ? (
                      <img src={sittingPreview} alt="Sitting preview" className={styles.photoPreview} />
                    ) : (
                      <div className={styles.photoPlaceholder}>No photo</div>
                    )}
                    <div className={styles.mediaActions}>
                      <label className={styles.uploadBtn}>
                        <input type="file" accept="image/*" onChange={handleSittingChange} />
                        {sittingPreview ? "Replace photo" : "Upload photo"}
                      </label>
                    </div>
                  </div>
                  {submitted && !sittingPreview && !sittingFile ? (
                    <p className={styles.error}>Sitting photo is required for providers.</p>
                  ) : null}
                </label>
              </>
            ) : null}
          </div>

          <label className={styles.label}>
            KYC document ({kycDocType})
            <div className={styles.fileRow}>
              <label className={styles.uploadBtn}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={handleKycFileChange}
                />
                Upload document
              </label>
              {kycExistingName ? <span className={styles.fileName}>{kycExistingName}</span> : null}
            </div>
          </label>
        </section>

        {isProvider ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Provider details</h2>

            <label className={styles.label}>
              Preferred languages *
              <Select<Option, true>
                styles={multiSelectStyles}
                isMulti
                options={languageOptions}
                value={selectedLanguages}
                onChange={(options) =>
                  setSelectedLanguages(options ? options.map((opt) => ({ ...opt })) : [])
                }
                placeholder={
                  languagesState.status === "loading"
                    ? "Loading languages…"
                    : "Select preferred languages"
                }
                isLoading={languagesState.status === "loading"}
                isDisabled={languageOptions.length === 0}
              />
              {submitted && selectedLanguages.length === 0 ? (
                <p className={styles.error}>Select at least one language.</p>
              ) : null}
            </label>

            <label className={styles.label}>
              Services *
              <Select<Option, true>
                styles={multiSelectStyles}
                isMulti
                options={serviceOptions}
                value={selectedServices}
                onChange={(options) =>
                  setSelectedServices(options ? options.map((opt) => ({ ...opt })) : [])
                }
                placeholder={
                  servicesState.status === "loading" ? "Loading services…" : "Select services"
                }
                isLoading={servicesState.status === "loading"}
                isDisabled={serviceOptions.length === 0}
              />
              {submitted && selectedServices.length === 0 ? (
                <p className={styles.error}>Select at least one service.</p>
              ) : null}
            </label>
          </section>
        ) : (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Languages</h2>
            <label className={styles.label}>
              Preferred languages
              <Select<Option, true>
                styles={multiSelectStyles}
                isMulti
                options={languageOptions}
                value={selectedLanguages}
                onChange={(options) =>
                  setSelectedLanguages(options ? options.map((opt) => ({ ...opt })) : [])
                }
                placeholder={
                  languagesState.status === "loading"
                    ? "Loading languages…"
                    : "Select preferred languages"
                }
                isLoading={languagesState.status === "loading"}
                isDisabled={languageOptions.length === 0}
              />
            </label>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Bank details</h2>
          <div className={styles.gridThree}>
            <label className={styles.label}>
              IBAN
              <input
                className={styles.input}
                value={iban}
                onChange={(e) => setIban(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Bank name
              <input
                className={styles.input}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Account holder
              <input
                className={styles.input}
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
              />
            </label>
          </div>
          <p className={styles.hint}>
            Bank details are optional. Provide them if you’d like to receive payouts.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Gallery</h2>
          <label className={styles.label}>
            Add gallery photos (optional)
            <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
          </label>
          {galleryLimitMessage ? (
            <p className={styles.error}>{galleryLimitMessage}</p>
          ) : (
            <p className={styles.hint}>Up to 12 photos to showcase your work.</p>
          )}

          <div className={styles.galleryGrid}>
            {galleryPhotos.map((photo, index) => (
              <div key={`${photo}-${index}`} className={styles.galleryItem}>
                <img src={photo} alt={`Gallery ${index + 1}`} className={styles.galleryImg} />
                <button
                  type="button"
                  className={styles.galleryRemove}
                  onClick={() => removeGalleryPhoto(index)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className={styles.primary}
            type="submit"
            disabled={loading}
            style={{ background: colors.accent, color: colors.white, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
