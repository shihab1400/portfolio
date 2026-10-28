---
title: PCMS
description: A programming contest system where admins run contests, authors write problems, and contestants submit solutions to a live leaderboard, all on a fixed Oracle 10g schema.
thumbnail: ./programming-contest.png
thumbnailAlt: PCMS contest list with Live, Upcoming and Ended contests for a signed-in contestant
technologies: [Node.js, Express, node-oracledb, Oracle 10g, JavaScript, HTML, CSS]
category: Web app
featured: true
repositoryUrl: https://github.com/shihab1400/ADBMS_Web_App
publishDate: 2026-09-03
purpose: Show that a complete three-role web application can run on an existing, documented Oracle 10g schema without adding a single sequence, trigger, view or column.
features:
    - Three roles (admin, author, contestant), each with its own screens and API permissions
    - Admins build contests, attach problems, and publish them as public or password-protected private
    - Authors write problems with test cases; contestants register, solve in an arena and submit code
    - A judge queue that claims each submission exactly once, plus a live leaderboard
    - A built-in database explorer for browsing tables, running SQL and demonstrating row locking
challenge: Oracle 10g is too old for node-oracledb's Thin mode and for any recent Oracle Client, and the schema had no sequences, no session table, no contest id on submissions and no unique constraints to lean on.
solution: Thick mode with a 64-bit Oracle Client 11.2, application-level answers for each schema gap (max-plus-one keys with retry on ORA-00001, signed cookie sessions, contests derived from problem membership and time window, duplicate checks in code), and a bind guard that rejects mismatched bind lists before Oracle can raise ORA-01036.
---

PCMS is an Advanced Database course project. It is a Node.js and Express application that sits on an existing ten-table Oracle Database 10g XE schema.

## Implementation

**Roles and access**

Sign-in issues an HMAC-signed, httpOnly cookie carrying the user id and an expiry. There is no session table; the only server-side state is an in-memory revocation list for logout. A switch in `src/auth.js` moves passwords from the as-typed values in the report to salted scrypt hashes, and verification reads both formats so nobody is locked out by flipping it.

**Contests and problems**

- **Admin:** creates contests, attaches problems, and publishes them as public or private (with a password). Drafts are stored as a `DRAFT` visibility value because the table has no draft column.
- **Author:** writes problems and test cases; the stored counters for problems created are kept in step.
- **Contestant:** browses contests, registers, opens problems in the arena and submits in C++, Java or Python.
- **Status:** Upcoming, Live and Ended are always derived from the database clock against the start and end times, never stored.

**Submissions and the leaderboard**

The submission table has no contest id. A submission counts toward a contest when its problem belongs to that contest and it was submitted inside the contest window. The leaderboard additionally requires the user to be registered.

**The judge**

The judge is simulated: it does not compile or run code. What is real is the queue. A worker claims each submission once with `SELECT … FOR UPDATE NOWAIT` on a dedicated connection, skipping rows it cannot lock because Oracle 10g has no `SKIP LOCKED`. It then writes the status, execution time and memory back and updates the solved count. Verdicts are deterministic so a demo is repeatable.

**Working with Oracle 10g**

- **Keys:** with no sequences or triggers, every insert takes the highest key plus one and retries on a primary key violation, up to six times.
- **Large text:** CLOB columns are written with `TO_CLOB` from values capped at 3900 characters, to stay under the 4000-byte bind limit, and read back as strings.
- **Bind guard:** the database layer compares the bind object to the placeholders in the SQL and throws a clear error on any mismatch, and a lint script catches reserved-word bind names before Oracle reports ORA-01745.
- **Duplicates:** without unique constraints on email, username or registration, duplicates are blocked in application code.

## Database explorer

A second page served at `/explorer` reads the data dictionary at runtime to browse any table, insert, update and delete rows, run SQL and PL/SQL, and show row locking between two sessions.

## Design

The interface is a vanilla JavaScript single-page app with a router and one view module per role, served for any non-API address so deep links to contests, the arena and the leaderboard work.
