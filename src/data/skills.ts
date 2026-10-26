export interface SkillGroup {
    title: string;
    items: string[];
}

/** Example values: edit to match your own toolkit. */
export const skillGroups: SkillGroup[] = [
    {
        title: "Languages",
        items: ["C++", "Java", "C#", "Python", "JavaScript", "TypeScript", "PHP"],
    },
    {
        title: "Databases",
        items: ["PostgreSQL", "MySQL", "MongoDB", "Microsoft SQL Server", "Oracle"],
    },
    {
        title: "Tools",
        items: ["Git", "GitHub", "Postman", "VS Code", "Visual Studio", "Font Awesome"],
    },
    { title: "AI/ML", items: ["RAG", "LLM Integration", "ChromaDB", "Prompt Engineering"] },
    {
        title: "Frontend",
        items: ["React.js", "Next.js", "HTML", "CSS", "Tailwind CSS", "Bootstrap"],
    },
    { title: "Backend", items: ["Node.js", "Express.js", "NestJS", "ASP.NET Core"] },
    { title: "IoT", items: ["ESP32", "Arduino UNO"] },
];
