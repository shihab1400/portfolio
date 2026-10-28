/**
 * Central site configuration. Edit these values to personalise the portfolio.
 * Text marked "placeholder" should be replaced with the owner's own content.
 */
const email = "shihabcoc39@gmail.com";
/** E.164 format, used for the tel: link and structured data. */
const phone = "+8801568989213";

export const site = {
    name: "Farhat",
    /** Short role line used in the footer, metadata and structured data. */
    role: "Full-stack web developer",
    defaultTitle: "Farhat",
    defaultDescription:
        "Portfolio of Farhat, a Full-stack web developer building responsive, accessible websites.",
    email,
    /** Opens a Gmail compose window instead of the visitor's default mail app (mailto:). */
    emailLink: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`,
    phone,
    /** Human-readable version of `phone` shown on the page. */
    phoneDisplay: "+880 1568-989213",
    phoneLink: `tel:${phone}`,
    locale: "en",
    ogLocale: "en_US",
    /** Twitter/X handle including "@", or undefined to omit `twitter:site`. */
    twitterHandle: undefined as string | undefined,

    hero: {
        // Words inside [brackets] are highlighted in the accent colour.
        headline: "Farhat is a Full-stack web developer",
        description: "Crafting full-stack websites with the latest technologies",
        portraitAlt: "Farhat Anjam",
    },

    /** Manually maintained status shown under the hero portrait. Set to undefined to hide. */
    status: { label: "Currently working on", value: "RAG based chatbot" } as
        { label: string; value: string } | undefined,

    quote: {
        text: "Money can't buy happiness, but it can pay the AI subscription!",
        author: "Dr. Dev",
    },

    contact: {
        intro: "I'm currently looking for internship opportunities in full-stack web development where I can apply my skills, learn from experienced developers, and contribute to real-world projects. If you're hiring interns or would like to connect, feel free to reach out!",
    },

    theme: {
        /** Theme used when the visitor has no saved preference. */
        default: "dark" as "dark" | "light",
        /** When true, a visitor's OS light/dark preference overrides `default` until they choose a theme. */
        respectSystemPreference: false,
        colors: { dark: "#282C33", light: "#F6F6F8" },
    },
} as const;
