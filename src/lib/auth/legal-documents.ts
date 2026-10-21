// Bump this version when changing the documents presented at registration.
export const legalDocuments = {
  version: "2026-10-20.2",
  updatedLabel: "20 de outubro de 2026",
} as const;

export type SignupAgreement = {
  version: string;
  accepted_at: string;
  terms_accepted: true;
  privacy_acknowledged: true;
};

// Only the server calls this when a valid, explicit agreement was submitted.
export function signupAgreement(now = Date.now()): SignupAgreement {
  return {version: legalDocuments.version, accepted_at: new Date(now).toISOString(), terms_accepted: true, privacy_acknowledged: true};
}
