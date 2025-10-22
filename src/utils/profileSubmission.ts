import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import type { CreateProfileRequest } from "@/services/profileService";
import type { Language, Nationality, Service } from "@/services/metaService";

type StoredMetaKey = "meta.services" | "meta.languages" | "meta.nationalities";

const dataUrlToFile = (
  dataUrl: string | null | undefined,
  fileName: string,
  explicitType?: string | null
): File | null => {
  if (!dataUrl) return null;
  const parts = dataUrl.split(",");
  if (parts.length < 2) return null;
  const meta = parts[0];
  const base64 = parts[1];
  const mimeMatch = meta.match(/data:(.*?);/);
  const mime = explicitType || (mimeMatch ? mimeMatch[1] : "application/octet-stream");
  try {
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const hasExtension = /\.[a-zA-Z0-9]{2,}$/.test(fileName);
    const inferredExt = mime.split("/")[1] || "bin";
    const friendlyExt = inferredExt === "jpeg" ? "jpg" : inferredExt;
    const finalName = hasExtension ? fileName : `${fileName}.${friendlyExt}`;
    return new File([buffer], finalName, { type: mime });
  } catch {
    return null;
  }
};

const readMeta = <T>(key: StoredMetaKey): T[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const uniqueNumbers = (values: Array<number | null | undefined>): number[] => {
  const filtered = values.filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value)
  );
  return Array.from(new Set(filtered));
};

const normaliseServiceIds = (
  raw: Array<number | string>,
  services: Service[]
): number[] => {
  const ids = raw.map((value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    if (typeof value === "string") {
      const normalised = value.replace(/_/g, " ").toLowerCase();
      const match = services.find(
        (svc) => svc.name.toLowerCase() === normalised || svc.name.toLowerCase() === value.toLowerCase()
      );
      return match?.id ?? null;
    }
    return null;
  });
  return uniqueNumbers(ids);
};

const resolveLanguageIds = (
  identity: Record<string, unknown>,
  languages: Language[]
): number[] => {
  const storedIds = Array.isArray(identity.preferredLanguageIds)
    ? uniqueNumbers(identity.preferredLanguageIds as Array<number>)
    : [];
  if (storedIds.length) return storedIds;

  const fallbackList = Array.isArray(identity.preferredLanguages)
    ? (identity.preferredLanguages as Array<string>)
    : typeof identity.preferredLanguage === "string"
    ? identity.preferredLanguage.split(",").map((lang) => lang.trim())
    : [];

  const mapped = fallbackList.map((lang) => {
    const normalised = lang.toLowerCase();
    const match = languages.find((item) => {
      const nameMatch = item.name?.toLowerCase() === normalised;
      const codeMatch = item.code?.toLowerCase() === normalised;
      return nameMatch || codeMatch;
    });
    return match?.id ?? null;
  });

  return uniqueNumbers(mapped);
};

const resolveNationalityId = (
  identity: Record<string, unknown>,
  nationalities: Nationality[]
): number | string => {
  const explicitId = (identity.nationality_id ?? identity.nationalityId) as number | undefined;
  if (typeof explicitId === "number" && Number.isFinite(explicitId)) return explicitId;

  const code = identity.nationalityCode as string | undefined;
  if (code) {
    const match = nationalities.find((nat) => nat.code.toLowerCase() === code.toLowerCase());
    if (match) return match.id;
  }

  const name = identity.nationality as string | undefined;
  if (name) {
    const match = nationalities.find((nat) => nat.name.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
  }

  return code || "AE";
};

type BuildProfilePayloadOptions = {
  serviceIds?: number[];
  requireMedia?: boolean;
};

function safeParseJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function buildProfileSubmissionPayload(
  options: BuildProfilePayloadOptions = {}
): CreateProfileRequest {
  const { serviceIds, requireMedia = true } = options;

  const currentProfile = safeParseJSON<Record<string, any>>("profile", {});
  const identity = safeParseJSON<Record<string, any>>("kyc.identity", {});
  const location = safeParseJSON<Record<string, any>>("location", {});
  const bank = safeParseJSON<Record<string, any>>("bank", {});
  const kycFiles = safeParseJSON<Record<string, any>>("kyc.files", {});

  const firstName = (currentProfile.firstName || currentProfile.fname || "").trim();
  const lastName = (currentProfile.lastName || currentProfile.lname || "").trim();
  const email =
    (currentProfile.email || identity.email || identity.contactEmail || "").trim();
  const dob = identity.dob as string | undefined;

  if (!firstName || !lastName || !dob || !email) {
    throw new Error(
      "Your personal details are incomplete. Please return to the previous steps and fill them out."
    );
  }

  const rawPhone =
    (identity.phone as string | undefined) ||
    (currentProfile.phone as string | undefined) ||
    "";

  const parsedPhone = rawPhone ? parsePhoneNumberFromString(rawPhone) : null;
  const dialCode = parsedPhone ? `+${parsedPhone.countryCallingCode}` : "";
  const phoneNumber = parsedPhone
    ? parsedPhone.nationalNumber.toString()
    : rawPhone.replace(/[^\d]/g, "");

  if (!dialCode || !phoneNumber) {
    throw new Error("Please provide a valid mobile number in the identity step.");
  }

  const personType =
    (identity.personType as "individual" | "company" | undefined) ?? "individual";

  const metaServices = readMeta<Service>("meta.services");
  const metaLanguages = readMeta<Language>("meta.languages");
  const metaNationalities = readMeta<Nationality>("meta.nationalities");

  const resolvedServiceRaw = (() => {
    if (Array.isArray(serviceIds) && serviceIds.length > 0) return serviceIds;
    const stored = safeParseJSON<any[]>("provider.services", []);
    return Array.isArray(stored) ? stored : [];
  })();

  const resolvedServiceIds = normaliseServiceIds(
    resolvedServiceRaw as Array<number | string>,
    metaServices
  );

  if (!resolvedServiceIds.length) {
    throw new Error("We couldn't match your selected services to their IDs.");
  }

  const languageIds = resolveLanguageIds(identity, metaLanguages);

  const profilePhotoFile = dataUrlToFile(
    currentProfile.profilePhoto,
    "profile-picture"
  );
  const standingPhotoFile = dataUrlToFile(
    currentProfile.standingPhoto || currentProfile.fullBodyPhoto,
    "standing-photo"
  );
  const sittingPhotoFile = dataUrlToFile(
    currentProfile.sittingPhoto || currentProfile.seatedPhoto,
    "sitting-photo"
  );

  if (requireMedia && (!profilePhotoFile || !standingPhotoFile || !sittingPhotoFile)) {
    throw new Error("Please upload profile, standing, and sitting photos before continuing.");
  }

  const kycDocumentData = kycFiles?.kycDocument;
  const kycDocumentFile = dataUrlToFile(
    kycDocumentData?.dataUrl,
    kycDocumentData?.name || "kyc-document",
    kycDocumentData?.type || null
  );
  if (requireMedia && !kycDocumentFile) {
    throw new Error("KYC document is missing. Please upload it in the identity step.");
  }

  const docTypeRaw = (identity.docType as string | undefined) ?? "personal_id";
  const kycDocType = docTypeRaw;

  const addressText = (location.address as string | undefined) || "";
  const addressParts = addressText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const addressLine1 = addressParts[0] || addressText || "Address not provided";
  const addressLine2 = addressParts[1] || "";
  const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : "";
  const state = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : "";
  const countryCode = (identity.nationalityCode as string | undefined) || "AE";

  const latitude =
    typeof location.lat === "number"
      ? (location.lat as number)
      : ((location.latitude as number | undefined) ?? null);
  const longitude =
    typeof location.lng === "number"
      ? (location.lng as number)
      : ((location.longitude as number | undefined) ?? null);

  const bankAccount =
    bank && bank.iban && bank.bankName && bank.accountHolder
      ? {
          iban: bank.iban as string,
          bank_name: bank.bankName as string,
          account_holder_name: bank.accountHolder as string,
        }
      : undefined;

  const nationalityValue = resolveNationalityId(identity, metaNationalities);

  return {
    type: "provider",
    profile: {
      fname: firstName,
      lname: lastName,
      dob,
      email,
      dial_code: dialCode,
      phone_number: phoneNumber,
      type: personType,
      bio:
        (currentProfile.bio as string | undefined) ||
        (currentProfile.about as string | undefined) ||
        "",
      nationality_id: nationalityValue,
    },
    address: {
      line1: addressLine1,
      line2: addressLine2 || null,
      city,
      state: state || null,
      building: currentProfile.building || null,
      apartment: currentProfile.apartment || null,
      country_code: countryCode,
      postal_code: (currentProfile.postalCode as string | undefined) || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      active: 1,
    },
    bank_account: bankAccount,
    kyc_doc_type: kycDocType,
    service_ids: resolvedServiceIds,
    language_ids: languageIds.length ? languageIds : undefined,
    profile_picture_img: profilePhotoFile || undefined,
    standing_img: standingPhotoFile || undefined,
    sitten_img: sittingPhotoFile || undefined,
    kyc_document: kycDocumentFile || undefined,
  };
}
