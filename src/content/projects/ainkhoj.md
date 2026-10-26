---
title: Ainkhoj
description: A retrieval-based chatbot that answers Bangladesh law questions only from real Acts, cites the sections it used, and handles everything else as a general assistant.
thumbnail: ./ainkhoj.png
thumbnailAlt: Ainkhoj chat screen with a history sidebar, an answer showing a law badge and a numbered list of cited sections, and a message box with an answer-mode picker
technologies:
    [
        Next.js,
        React,
        TypeScript,
        NestJS,
        Firebase Auth,
        Firestore,
        Python,
        FastAPI,
        ChromaDB,
        Sentence Transformers,
        Gemini API,
        Gemma,
        LM Studio,
    ]
category: AI / RAG
featured: true
repositoryUrl: https://github.com/shihab1400/AinKhoj
publishDate: 2026-10-26
purpose: Give people trustworthy answers about Bangladesh law by answering only from the text of the Acts and showing exactly which sections were used, instead of letting a language model guess.
features:
    - Legal answers are written only from retrieved Act excerpts, cite the Act and section, and show their sources as expandable cards
    - A router step decides whether a question is legal, which law database fits, or that no database covers it, in which case the bot says so instead of guessing
    - An answer-mode picker in the message box with Auto, General (straight to Gemini) and Specific law, whose choices come from the dataset files
    - Google sign-in with per-user chat history, light and dark themes, and a phone layout
    - A new area of law is one data file and one command, with no code changes
challenge: A confident-sounding language model can invent section numbers and penalties, which is dangerous for legal questions, while the same app also has to answer ordinary questions and grow to new areas of law over time.
solution: Legal questions go to a vector search over the Acts, and a local Gemma model is told to answer only from the excerpts and to say when they don't contain the answer. Questions no database covers are refused, users can skip the routing step by choosing a mode, and each .jsonl file becomes its own searchable database that the router finds automatically.
---

## Implementation

**How a question is handled**

- **Router:** a small Gemini model reads the message and the recent conversation, then decides whether it is a legal question and which law database(s) could answer it. Follow-ups such as "and what is the penalty?" are understood from the earlier messages.
- **General questions** go to Gemini. Questions about the assistant itself, such as its name, count as general.
- **Covered legal questions** search only the matching database(s). A local Gemma model running in LM Studio answers from the retrieved excerpts alone, cites the Act and section, and says when the answer isn't there.
- **Uncovered legal questions** get a message listing the laws the bot does cover, rather than a guess.
- **Failures:** if the router fails, the bot falls back to searching the law databases rather than answering from general knowledge. If the search service is down, general questions still work.

**Answer modes**

The picker in the message box has three options:

- **Auto** uses the router above.
- **General** skips the router and the search, and goes straight to Gemini.
- **Specific law** lists the available databases and searches only the chosen one, again without a router call.

The backend validates the choice and rejects a database that doesn't exist. The last choice is remembered between visits.

**Search service**

Each `.jsonl` file in the data folder becomes one ChromaDB collection, embedded with a sentence-transformers model. The ingest script skips files that haven't changed, can re-embed everything after a model change, and can remove databases whose file was deleted. The running service picks up new data by itself, so a new law appears in the router and the mode picker within about 15 seconds, with no restart.

**Dataset preparation**

A preparation script cleans the raw law JSON. It fixes text encoding and spacing only, never the legal wording. It splits long sections into chunks, removes exact duplicates, and prints a report of anything suspicious for a person to review. The Education dataset holds 308 chunks from 27 Acts, and a small Criminal law sample shows how a second database is added.

**Accounts and data**

- **Sign-in:** Google login through Firebase. The API verifies the Firebase ID token on every request.
- **Storage:** chats live in Firestore under each user. Security rules block all direct browser access, so only the API can read or write them.
- **Saving:** a chat is saved only after the model has answered, so a failed request leaves no half-finished conversation.

**Naming**

The bot's name is one constant in the backend, used in every prompt, and one in the frontend, used in titles and screens. Renaming it is a two-line change.

## Design

The interface uses plain CSS with a green palette in light and dark themes. Answers render as formatted text, including lists, tables and code, instead of raw Markdown symbols. Under each answer, a badge shows how the question was handled, and an expandable list shows numbered source cards with the Act, section, chapter, a match percentage and the excerpt.

The sidebar groups chats by date and becomes a drawer on phones. The message box grows as you type, and the start screen offers suggestion cards labelled Law or General. Loading states show placeholders instead of blank screens, and animations turn off for users who prefer reduced motion.
