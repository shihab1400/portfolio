export interface Publication {
    title: string;
    /** Short label shown above the title, e.g. "Conference Paper". */
    type: string;
    url: string;
    /** Name of the site the link opens, shown on the card. */
    source: string;
}

export const publications: Publication[] = [
    {
        title: "Wi-Fi Enabled Smart Multi-Plug for Home Automation using ESP32 Microcontroller",
        type: "Conference Paper",
        url: "https://www.researchgate.net/publication/398689918",
        source: "ResearchGate",
    },
];
