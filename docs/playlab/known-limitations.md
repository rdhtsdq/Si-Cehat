# Known Limitations & Release Gates — Si-Cehat PlayLab MVP

> **Status:** MVP Baseline  
> **Date:** October 2026

The following limitations and prerequisites are documented to guide future development iterations and ensure child safeguarding:

---

## 1. Clinical & Content Limitations
1. **Placeholder Starter Content:**
   The starter dataset in `src/content/healthy-plate/v1.json` is a proposed working baseline grounded in Kemenkes RI *Isi Piringku*. It requires clinical review and sign-off by a qualified pediatric nutritionist before being deployed in an academic study.
2. **Simplified Distractor Set:**
   Only 2 distractor foods (Donat Gula and Soda Manis) are included in the MVP. Future content packs should expand to include local Indonesian packaged snacks (kerupuk kaleng, minuman boba, gorengan tepung).

---

## 2. Research & Evaluation Prerequisites
1. **Not a Validated Diagnostic Tool:**
   Gameplay performance scores (`gameplayScore`) reflect task completion within the game and must **never** be interpreted as a clinical diagnosis of dietary health or diabetes risk.
2. **Formal Research Ethics Approval:**
   Collecting identifiable child participant data for academic research requires institutional review board (IRB) approval, explicit parental consent, and child assent procedures.
3. **No Causal Efficacy Claims:**
   Completing this mini-game does not, by itself, prove long-term dietary behavior modification. Any effectiveness evaluation requires a formal comparative study protocol.

---

## 3. Technical & Operational Limitations
1. **Online Requirement for Session Completion:**
   The MVP requires active internet access to start sessions and record validated results. Offline session synchronization with client-side cryptographic queuing is deferred to future releases.
2. **Remote Git Repository Creation:**
   The local repository scaffold has been initialized in the workspace. Pushing to a hosted remote repository (e.g. GitHub/GitLab) and configuring automated production CI/CD pipelines remains a manual deployment action for the repository owner.
