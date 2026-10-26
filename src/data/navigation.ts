export interface NavItem {
    label: string;
    href: string;
    /** Homepage section id this item scrolls to. */
    section: string;
    /** Pages (path prefixes) that mark this item as active outside the homepage. */
    activeOn?: string;
}

export const navItems: NavItem[] = [
    { label: "home", href: "/#home", section: "home" },
    { label: "projects", href: "/#projects", section: "projects", activeOn: "/projects" },
    { label: "skills", href: "/#skills", section: "skills", activeOn: "/skills" },
    { label: "about-me", href: "/#about-me", section: "about-me", activeOn: "/about" },
    { label: "contacts", href: "/#contacts", section: "contacts" },
];
