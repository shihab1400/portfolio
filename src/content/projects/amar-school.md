---
title: Amar School
description: A tutor management system where trainers certify tutors, certified tutors teach paid courses, and students rate them when they finish.
thumbnail: ./amar-school.png
thumbnailAlt: Amar School landing page with a dark hero section, a "Top rated courses" panel and platform stats for courses, certified tutors, students and average rating
technologies:
    [ASP.NET Core MVC, C#, .NET 8, Entity Framework Core, SQL Server, Razor, Bootstrap 5, Swagger]
category: Web app
featured: true
repositoryUrl: https://github.com/shihab1400/dotNet_Tutor_MS
publishDate: 2026-10-26
purpose: Make sure every tutor is actually qualified for the subject they teach, by putting a trainer-issued certificate between "signed up" and "can take students".
features:
    - Five roles (guest, admin, trainer, tutor, student), each with its own sidebar, dashboard and permissions
    - Trainer-led training with printable certificates, and tutors can only offer courses they are certified for
    - Demo checkout with percentage and fixed-amount coupons that have expiry dates, usage limits and an on/off switch
    - Course materials (video, PDF, slides) that only enrolled users, the owner and the admin can download
    - 1–5 star ratings after course completion, and an admin-only activity log of every user action
challenge: The rules chain together (pay, train, get certified, offer, enroll, complete, rate), and any skipped step or half-finished payment would break that trust.
solution: Every rule is enforced in the repository layer instead of only hiding buttons, payment, coupon use and enrollment are saved in one database transaction, and unique indexes and check constraints in SQL Server stop duplicates and invalid data even if the code is bypassed.
---

Amar School is a university .NET course project, rebuilt from an early prototype into a complete application. It is a seven-project ASP.NET Core solution: entities, an EF Core data layer, a repository layer with the business rules, shared helpers, view models, the MVC web app, and a separate REST API with Swagger that reuses the same repositories.

## Implementation

**Roles and access**

Guests see only the landing page and can register as a student or a tutor. Trainer accounts can only be created by the admin, and the server rejects a registration that tries to forge any other role. Cookie authentication with role-based `[Authorize]` attributes protects every other page, and a deactivated account cannot log in.

**From training to teaching**

- **Training:** a trainer offers training for a course, and a tutor pays to enroll.
- **Certification:** the trainer marks the training complete, then issues a certificate with a unique number. Tutors can view and print it.
- **Teaching:** the "offer a course" form lists only courses the tutor is certified for, and the repository checks again on save.
- **Rating:** a student can rate a course once, and only after the tutor marks it complete. Average ratings show on every course card.

**Payments and coupons**

All pricing goes through a single quote method. A percentage coupon takes a share off the price, and a fixed coupon subtracts an amount, never going below zero. Expired, inactive and used-up coupons are rejected with a clear message. When the student or tutor pays, the payment record, the coupon's use count and the enrollment are written in one transaction, so a failure leaves nothing half-saved.

**Materials**

Tutors and trainers upload files to their own courses and trainings. Uploads are checked against an allow-list of extensions and a 100 MB limit, and stored under random names. Downloads go through the controller rather than as public static files, so each request is checked against enrollment.

**Activity log**

Every write action, plus logins, failed logins and logouts, records the user, role, action, affected record, details and IP address. Only the admin can see the log, which has search, role and date filters, and paging.

**Data and security**

- **Passwords** are hashed with PBKDF2 using ASP.NET Core's `PasswordHasher`.
- **Database rules:** SQL Server unique indexes stop double enrollment, duplicate certificates and repeat ratings, and check constraints limit roles, coupon types and rating values.
- **Forms** are protected with anti-forgery tokens.

## Design

The interface is a custom design system on Bootstrap 5: a dark sidebar app shell for signed-in users that collapses on mobile, a marketing-style landing page with live stats and top-rated courses, and two-column login and register screens. Dashboards show four stat cards per role, a recent-activity feed and quick actions. Students and tutors browse courses as filterable cards, while admins work in searchable tables.

## Demo data

A seeder fills an empty database on first run: 3 trainers, 8 tutors and 16 students, plus 19 courses across 5 groups. It also adds trainings, 20 certificates, 47 enrollments, 70 payments (many with coupons), 23 ratings with feedback, 98 downloadable materials and about 400 backdated log entries. Every screen has realistic content from the first login.
