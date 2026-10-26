import type { IconName } from "../lib/icons";

export interface SocialLink {
    label: string;
    url: string;
    icon: IconName;
}

/**
 * Placeholder profiles: replace YOUR_USERNAME with real handles, or remove entries
 * for platforms you don't use. Links containing "YOUR_USERNAME" are excluded from
 * structured data so search engines never see them as real profiles.
 */
export const socialLinks: SocialLink[] = [
    { label: "GitHub", url: "https://github.com/shihab1400", icon: "github" },
    {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/farhat-anjam-264845299/",
        icon: "linkedin",
    },
];

export const isPlaceholderUrl = (url: string) => url.includes("YOUR_USERNAME");
