export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export function getAdminEmails(): string[] {
  const raw = optionalEnv("ADMIN_EMAILS");

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getQuizWorldId(): string | undefined {
  return optionalEnv("QUIZ_WORLD_ID");
}
