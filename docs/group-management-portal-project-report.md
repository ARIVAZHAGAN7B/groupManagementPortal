# GROUP MANAGEMENT PORTAL

## Excel-Aligned Project Report Draft

Formatting note for final submission:
- Apply Times New Roman, font size 13, justified alignment, and 1.5 line spacing in the final word-processed version.
- Replace all bracketed placeholders before submission.
- Update final page numbers, table numbers, and figure numbers after typesetting.

---

## Cover Page

**Project Title:** Group Management Portal  
**Submitted by:** [STUDENT NAME 1], [STUDENT NAME 2], [STUDENT NAME 3]  
**Register Numbers:** [REG NO 1], [REG NO 2], [REG NO 3]  
**Degree:** Bachelor of Engineering / Technology  
**Department:** [DEPARTMENT OF FIRST-NAMED STUDENT]  
**Institution:** [COLLEGE NAME]  
**Academic Year:** [YEAR]  
**Project Guide:** [GUIDE NAME]  
**External Guide / Industry Mentor:** [IF APPLICABLE]  

## Inner Title Page

**GROUP MANAGEMENT PORTAL**

A project report submitted in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering / Technology in [DEPARTMENT OF FIRST-NAMED STUDENT]

Submitted by:
- [STUDENT NAME 1] - [REG NO 1]
- [STUDENT NAME 2] - [REG NO 2]
- [STUDENT NAME 3] - [REG NO 3]

Under the guidance of:
- [INTERNAL GUIDE NAME], [DESIGNATION], [DEPARTMENT]
- [EXTERNAL GUIDE NAME], [DESIGNATION], [ORGANIZATION] (if applicable)

[INSTITUTION NAME]  
[MONTH, YEAR]

## Bonafide Certificate

This is to certify that the project report titled **"Group Management Portal"** is a bonafide record of project work done by **[STUDENT NAME 1]**, **[STUDENT NAME 2]**, and **[STUDENT NAME 3]** of the Department of **[DEPARTMENT OF FIRST-NAMED STUDENT]**, [INSTITUTION NAME], during the academic year [YEAR], in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering / Technology.

**Project Guide**  
[NAME, DESIGNATION, DEPARTMENT]

**Head of the Department**  
[NAME, DESIGNATION, DEPARTMENT]

## Bonafide Certificate from Industry (If Applicable)

This section is applicable only if the project has been carried out with direct industry mentorship or deployment support. In that case, the certificate should be printed on official letterhead and must include student names, register numbers, project title, signature, seal, and designation of the external authority.

For the present project, if there is no external industry association, this section may be marked **Not Applicable**.

## Declaration

We hereby declare that this project report titled **"Group Management Portal"** is the original work carried out by us under the guidance of **[GUIDE NAME]** and has not been submitted in part or full to any other university or institution for the award of any other degree, diploma, or certificate.

**Student Signatures**
- [STUDENT NAME 1]
- [STUDENT NAME 2]
- [STUDENT NAME 3]

## Acknowledgement

We express our sincere gratitude to our project guide **[GUIDE NAME]** for the consistent technical guidance, constructive criticism, and valuable encouragement provided throughout the development of the Group Management Portal. The completion of this work was possible because of the steady support received during requirement analysis, implementation, validation, and documentation.

We are thankful to the **Head of the Department**, the faculty members of **[DEPARTMENT NAME]**, and the management of **[INSTITUTION NAME]** for the academic environment and infrastructure support required to carry out this project. We also extend our appreciation to the peers who provided domain feedback related to student activity management, phase workflows, and event participation tracking.

Special thanks are due to the open-source communities behind React, Express, MySQL, Redux Toolkit, Socket.IO, Vite, and related tooling. Their documentation and ecosystem support significantly accelerated the engineering effort and helped in shaping a maintainable full-stack solution.

Finally, we thank our parents and well-wishers for their unwavering encouragement and support throughout the project period.

## Abstract

Academic institutions increasingly rely on digital platforms to manage student activities, monitor participation, coordinate events, and evaluate performance over structured review periods. However, many existing workflows are still fragmented across spreadsheets, manual approvals, isolated portals, and ad hoc communication channels. Such fragmentation creates delays in decision-making, reduces data visibility, and makes it difficult for administrators and students to track operational progress consistently. The proposed **Group Management Portal** addresses this problem by providing a centralized full-stack web application for managing student groups, memberships, phases, eligibility, teams, hubs, event groups, requests, audit trails, and real-time notifications.

The project is implemented using a React-based frontend and an Express plus MySQL backend. The system uses cookie-based JWT authentication, role-based access control, modular service-oriented backend design, Redux Toolkit state management, RTK Query-based shared data flows, and Socket.IO for real-time room-based updates. In addition to standard CRUD features, the platform includes phase scheduling, automated phase finalization, target-based eligibility evaluation, event participation management, group point calculation, leadership and tier request workflows, and operational settings for holidays and incubation policies. The design emphasizes maintainability, traceability, and support for both administrative and student-facing use cases.

The developed portal demonstrates that institution-level student operations can be made more transparent, rule-driven, and scalable through a unified application architecture. Build verification confirms that the frontend can be packaged successfully for production. The analysis of the current codebase also shows clear strengths in modular separation and workflow coverage, while highlighting areas for future improvement such as automated backend testing, lint compliance, and deeper observability. Overall, the project provides a practical digital foundation for academic group governance and can be extended into a deployable campus operations platform.

**Keywords:** student management system, group management, event management, eligibility engine, role-based access control, real-time web application

## Table of Contents

1. Cover Page  
2. Inner Title Page  
3. Bonafide Certificate  
4. Bonafide Certificate from Industry (If Applicable)  
5. Declaration  
6. Acknowledgement  
7. Abstract  
8. Table of Contents  
9. List of Tables  
10. List of Figures  
11. Abbreviations and Nomenclature  
12. Chapter 1 - Introduction  
13. Chapter 2 - Literature Survey  
14. Chapter 3 - Objectives and Methodology  
15. Chapter 4 - Proposed Work Modules  
16. Chapter 5 - Results and Discussion  
17. Chapter 6 - Conclusions and Suggestions for Future Work  
18. References  
19. Appendices  

## List of Tables

Table 1.1 Existing operational pain points in manual and fragmented systems  
Table 1.2 Major objectives of the proposed portal  
Table 2.1 Comparative literature review summary  
Table 2.2 Identified research and implementation gaps  
Table 3.1 Functional requirements  
Table 3.2 Non-functional requirements  
Table 3.3 Technology stack justification  
Table 3.4 Major backend modules and responsibilities  
Table 3.5 Core database entities  
Table 3.6 Security and access-control mapping  
Table 4.1 Group management workflow summary  
Table 4.2 Eligibility computation inputs and outputs  
Table 4.3 Event and participation workflow summary  
Table 5.1 Implementation snapshot and codebase size indicators  
Table 5.2 Verification results  
Table 5.3 Strengths and limitations review  
Table 5.4 Cost-benefit analysis  
Table 6.1 Suggested future enhancements  
Table A.1 Bill of materials  
Table A.2 Work contribution matrix  

## List of Figures

Figure 1.1 High-level problem context  
Figure 1.2 Scope of the proposed portal  
Figure 3.1 Overall system architecture  
Figure 3.2 Frontend navigation architecture  
Figure 3.3 Backend modular architecture  
Figure 3.4 Authentication and authorization flow  
Figure 3.5 Database interaction flow  
Figure 3.6 Phase scheduling and finalization lifecycle  
Figure 4.1 Group and membership management workflow  
Figure 4.2 Eligibility and points engine workflow  
Figure 4.3 Event, team, and hub workflow  
Figure 4.4 Real-time notification room model  
Figure 5.1 Validation and deployment readiness overview  
Figure A.1 Sample route-to-module traceability map  

## Abbreviations and Nomenclature

- API - Application Programming Interface
- CORS - Cross-Origin Resource Sharing
- CRUD - Create, Read, Update, Delete
- DBMS - Database Management System
- EMS - Event Management System
- HOD - Head of Department
- HTTP - Hypertext Transfer Protocol
- JWT - JSON Web Token
- OSIS - Online Student Information System
- RBAC - Role-Based Access Control
- REST - Representational State Transfer
- RTK - Redux Toolkit
- SQL - Structured Query Language
- UI - User Interface
- URL - Uniform Resource Locator
- UX - User Experience

# Chapter 1 - Introduction

## 1.1 Background of the Work

Digital transformation in higher education has gone far beyond classroom delivery and online examinations. Institutions now need reliable systems to manage student clubs, academic groups, event participation, team formation, leadership structures, internal rankings, eligibility decisions, and policy-driven workflows. These activities are not auxiliary anymore; they shape how students collaborate, gain recognition, participate in competitions, and demonstrate institutional engagement. As a result, academic operations increasingly require software systems that are both administrative in nature and student-centered in experience.

Many institutions still manage these processes through fragmented mechanisms. Membership changes may be tracked in one spreadsheet, event approvals may happen through messaging applications, points may be calculated manually, and eligibility decisions may be stored in isolated files. While such approaches may work temporarily for small batches, they become difficult to sustain as participation scales. Delays accumulate, rule enforcement becomes inconsistent, and transparency declines because no single source of truth exists for both administrators and students.

The Group Management Portal is proposed as an integrated response to this institutional problem. It is designed as a full-stack web application that centralizes operational entities such as groups, memberships, phases, events, teams, hubs, event groups, join requests, eligibility scores, and administrative policies. The project is not only a CRUD system; it aims to formalize the workflows that connect these entities. In other words, the project turns disconnected administrative steps into traceable, rule-driven, and role-aware processes.

## 1.2 Institutional Context and Problem Domain

The core domain of the project is student group governance. In many academic environments, students are organized into primary groups and additional sub-structures such as teams, hubs, and event-specific teams. These structures are dynamic. Students join, leave, request membership changes, participate in competitions, assume leadership roles, and get evaluated based on targets or rules that vary by period. Administrators need visibility into both the static and dynamic parts of this ecosystem.

The problem domain becomes more complex when operational rules are introduced. A group may need a minimum and maximum number of members before activation. A phase may have start dates, end dates, change-day rules, and tier-specific targets. Eligibility may depend on points accumulated by individual students and groups during a defined window. Event participation may require team size constraints, round schedules, hub restrictions, and registration windows. Each of these is manageable in isolation, but the institution needs them to work together coherently.

This is exactly where conventional manual practices begin to fail. A rule might exist, but it may not be enforced uniformly. Students may not know their current status. Admins may spend excessive time answering repetitive queries or reconciling data from multiple sources. Leaders may not know whether their teams are eligible or whether a phase deadline has changed. These problems are not caused by a lack of effort; they are caused by the absence of a unified digital process model.

## 1.3 Motivation

The motivation for this project comes from both operational inefficiency and the need for institutional transparency. A modern academic setting needs more than a data-entry tool. It needs a system that makes rule enforcement visible and reproducible. Students should be able to understand why they are eligible or ineligible, why a request is pending, what event constraints apply, and how their group is performing. Similarly, administrators should be able to act based on current data rather than manually reconstructed snapshots.

Another key motivation is the reduction of duplicated effort. In a fragmented setup, the same data is often re-entered or re-verified across multiple contexts. For example, group membership might influence phase evaluation, event registration, leaderboard calculations, and leadership review. If these areas are managed separately, the institution repeatedly redoes the same verification work. A centralized platform reduces that duplication by storing and reusing operational state in a normalized form.

Scalability is also a strong motivator. Even if manual coordination is initially acceptable for one cohort, the workload grows rapidly when multiple phases, batches, groups, competitions, and review cycles overlap. The codebase addresses this by introducing structured backend modules, relational data storage, scheduled jobs, and role-segregated interfaces. This indicates that the project was motivated not merely by software curiosity, but by a real need to manage growing institutional complexity.

## 1.4 Problem Statement

The problem addressed in this project can be stated as follows:

Academic institutions that manage student groups, memberships, phase targets, eligibility evaluations, event participation, and leadership workflows often lack a single integrated platform to coordinate these activities. Existing processes become fragmented, manual, and difficult to audit, resulting in delayed decisions, inconsistent rule enforcement, low transparency for students, and high operational overhead for administrators. Therefore, there is a need for a centralized, secure, role-based, and workflow-aware web application that can unify these functions into a maintainable and scalable digital system.

## 1.5 Need of the Study

The need for this study is rooted in the limitations of both manual management and partially digitized systems. Earlier student information systems improved access to records, but many of them focused on academic records, attendance, or faculty operations rather than collaborative student governance. Security-oriented studies further show that student systems must protect sensitive data and access rights carefully, especially when multiple roles interact with the same platform. At the same time, access control research demonstrates that role-driven authorization remains one of the most effective models for separating responsibilities at scale.

The study is also needed because current campus operations involve increasingly time-sensitive workflows. Phases need to start and end correctly, eligibility must be evaluated using configured rules, and events need registration, membership, and result-tracking support. Real-time visibility becomes valuable in such contexts because stale information creates confusion and repeated follow-up work. The use of real-time communication and scheduled backend jobs in this project reflects that operational reality.

## 1.6 Objectives of the Proposed Work

The major objectives of the Group Management Portal are as follows:

1. To design and implement a centralized web platform for managing student groups, teams, hubs, and event groups.
2. To provide role-based login and session-controlled access for students, admins, and system administrators.
3. To automate phase configuration, target tracking, and phase-end finalization using date-aware scheduling logic.
4. To develop an eligibility engine that evaluates students and groups using configurable targets and point histories.
5. To support event management, participation requests, invitations, and team-based workflows within a single operational environment.
6. To maintain transparent operational records through audit logging, history views, and dashboard-oriented reporting.
7. To improve coordination efficiency by integrating real-time notifications and shared workflow visibility across users.

## 1.7 Scope of the Proposed Work

The scope of the project covers both data management and workflow management. At the data level, the system stores users, students, admins, groups, memberships, teams, hubs, events, requests, targets, points, and logs in a relational database. At the workflow level, it implements processes such as group activation, joining and leaving, eligibility evaluation, event registration, request approval, leadership handling, team tier change review, and phase scheduling.

The frontend scope includes two major user spaces: a student workspace and an admin workspace. The student workspace focuses on personal visibility, discovery, participation, and status tracking. The admin workspace focuses on governance, policy enforcement, and operational supervision. The backend scope includes API design, authentication middleware, database repository layers, business services, job scheduling, and Socket.IO-based real-time synchronization.

The project does not currently include full-fledged analytics dashboards with advanced predictive modeling, multi-institution tenancy, mobile-native applications, or comprehensive automated backend testing. These remain outside the current implementation boundary and are considered future expansion directions rather than current deliverables.

## 1.8 Organization of the Report

This report is organized into six chapters. Chapter 1 introduces the domain, motivation, objectives, scope, and problem statement of the proposed work. Chapter 2 reviews relevant literature on student information systems, role-based access control, secure web portals, event management, and supporting web technologies. Chapter 3 explains the objectives and methodology of the project, including requirements, architecture, database design, technology choices, and workflow logic. Chapter 4 presents the proposed work modules in detail and explains how each functional area is implemented in the portal. Chapter 5 discusses the achieved results, engineering observations, strengths, limitations, and cost-benefit implications of the developed system. Chapter 6 concludes the work and outlines future enhancements for institutional deployment and technical maturity.

## Chapter 1 Summary

This chapter established the motivation and institutional relevance of the Group Management Portal. It explained why fragmented administrative workflows create operational inefficiencies and why a centralized, rule-aware, full-stack platform is needed. The chapter also defined the problem statement, objectives, scope, and report structure. The next chapter examines prior work and related systems that inform the design of the proposed solution.

# Chapter 2 - Literature Survey

## 2.1 Introduction to the Survey

The literature survey for this project covers three closely related areas: student information management systems, secure and role-based access control models, and web-based event or workflow management systems. Because the Group Management Portal is a practical engineering system rather than a purely theoretical model, the survey also considers current technical documentation where it directly informs implementation choices. The goal of the survey is not to collect unrelated software references, but to identify patterns, strengths, and limitations in prior systems that resemble the operational needs of the proposed work.

Early and mid-stage student information systems primarily focused on storing academic records and simplifying administrative access. These systems established the value of centralized records but often lacked deeper workflow integration across event management, group-based participation, or policy-driven student engagement. More recent work has begun to recognize the need for web-based coordination, improved security, and richer service integration. This shift is directly relevant to the present project.

## 2.2 Web-Based Student Information Systems

Lubanga et al. (2018) discussed a web-based student information management system in universities and highlighted how centralized online systems can help institutions harness student records through internet-based access. Their study also emphasized practical deployment issues such as infrastructure readiness and user adoption. This is important for the present project because it shows that digitization is not only a software challenge but also an operational one. The Group Management Portal extends this line of thought by moving from record centralization to workflow centralization.

John et al. (2022) presented a student information management system focused on automating institution-level data handling. Their work described a tiered architecture and emphasized the movement of student data across modules such as administrators, faculty, and student-facing views. Although their context differs from the present project, the architectural concept of integrated tiers aligns closely with the full-stack design adopted here. The major difference is that the Group Management Portal places stronger emphasis on collaborative group workflows, tiered targets, and rule-driven evaluations.

Shelke et al. (2025) described a web-based solution for academic administration that centralizes student, teacher, and administrative interactions. Their work reinforces the continuing relevance of web platforms in reducing manual operations and improving transparency. However, it remains comparatively broad in academic administration scope. The present project narrows its focus toward campus group governance, event participation, and operational scoring, thereby offering a more specialized but deeper workflow model.

## 2.3 Security Considerations in Student Information Systems

Security is a recurring theme in literature related to student data systems. Falebita (2022) argued that institutions often migrate from paper-based systems to web-based portals without adequately addressing the security architecture of the new platform. This insight is highly relevant because student platforms handle identity, participation records, eligibility outcomes, and potentially sensitive audit information. A digital platform that improves usability but ignores authentication, authorization, and session integrity can create new institutional risks.

Kifaru et al. (2023) further examined the cybersecurity implications of student information management systems and showed that the integrity and reputation of educational institutions are directly affected by how securely student data is handled. This is especially relevant for the present project because a portal that supports multiple roles, approvals, and visibility layers must carefully separate user privileges and ensure traceable actions.

Security analysis in educational systems also points to the importance of protecting both database records and operational decisions. The present project responds to this by combining cookie-based authentication, role middleware, database-backed logs, and scoped real-time communication instead of relying on open or loosely controlled update flows.

## 2.4 Role-Based Access Control Literature

Ferraiolo and Kuhn (1992) introduced role-based access control as a more appropriate model than discretionary access control for many commercial and civilian applications. Their work is foundational because it formalized the idea that access should be assigned through organizational roles instead of direct user-to-permission relationships. In a portal where students, admins, and system admins have structurally different powers, this principle is not optional; it is central.

Sandhu et al. (2000) further developed the NIST model for RBAC by unifying core ideas into a standard-oriented framework. The model distinguishes flat, hierarchical, constrained, and symmetric RBAC. Although the Group Management Portal does not implement the full academic richness of all RBAC variants, it clearly reflects the standardized idea that permissions should follow role identity and operational constraints. This is visible in route protection, middleware checks, and role-scoped interfaces.

Coyne et al. (2011) discussed role engineering and the need for carefully designing permission structures rather than merely naming roles. This insight is directly applicable to the present project. It is not enough to say that a user is an admin; the system must decide what that admin can create, review, activate, archive, or override. The codebase demonstrates this practical role engineering orientation by separating features across route groups and workflow contexts.

## 2.5 Event Management and Related Workflow Systems

Shah et al. (2023) developed a web-based Event Management System and highlighted how digital event planning can reduce process fragmentation and consolidate event actions into a single console. This is strongly aligned with the event-focused modules in the Group Management Portal. However, the present project goes further by integrating event workflows with student groups, eligibility, team memberships, and request handling.

Event systems in educational settings often fail when they exist as isolated modules without connections to student identity, team structure, or eligibility conditions. The present project addresses that limitation by treating events not as standalone records but as part of a larger student operations ecosystem. Event groups, invitations, join requests, hub restrictions, and participation counts are therefore modeled as connected components rather than isolated screens.

## 2.6 Supporting Technical Knowledge from Standards and Official Documentation

In addition to academic literature, current technical documentation plays an important role in engineering this project correctly. RFC 7519 defines JSON Web Tokens as compact claims representations suitable for web-based authorization contexts. This standard informs the project's session model, where authenticated state is derived from signed tokens. RFC 6455 defines the WebSocket protocol for two-way communication and is relevant to the project's real-time layer.

The React documentation explains that `useEffect` should be used to synchronize components with external systems, while `useEffectEvent` is intended for separating effect-driven events from reactive dependencies. These concepts are relevant because the frontend includes custom hooks and session-related logic that interact with timers, focus events, network state, and real-time subscriptions. React Router documentation supports the route-structured client navigation model used for admin and student dashboards. Redux Toolkit documentation, especially RTK Query, is relevant because it formalizes efficient patterns for data fetching, cache lifetime management, and shared state access across complex component trees.

Similarly, Express routing documentation is relevant because the server organizes operational endpoints through structured route mounting and middleware interception. Socket.IO documentation on rooms is directly applicable because the project assigns users to rooms based on identity, role, group, and team scope. The MySQL reference manual is also relevant because the project depends on relational schema design, transactional writes, and indexed operational data. Vite documentation supports the frontend build strategy used for fast local development and optimized production packaging.

## 2.7 Comparative Analysis and Gap Identification

The reviewed studies collectively show that the core ideas behind the present project are well grounded: institutions benefit from centralized student information systems, secure access control is essential, and web-based event management reduces administrative friction. Yet a clear gap remains. Many systems centralize records but do not deeply integrate group governance, eligibility, event workflow, leadership reviews, and time-bound operational phases into a single portal.

The literature also shows that security and role modeling are often discussed separately from workflow digitization. In practical institutional settings, however, these concerns are inseparable. A student portal must not only be secure; it must be secure while supporting complex operational state transitions. The Group Management Portal attempts to address that missing integration point.

## 2.8 Problem Identification from the Survey

From the reviewed literature and technical context, the following implementation gaps become clear:

1. Many student systems centralize records but do not deeply integrate group governance, eligibility, and event management.
2. Security-oriented studies identify risks but do not always translate those findings into practical multi-role web workflow designs.
3. Event management systems often operate independently of student group structures and institutional scoring rules.
4. Existing work rarely combines scheduled period management, target-based evaluation, request workflows, and real-time room-based updates into a single platform.
5. There is limited evidence of campus-oriented systems that serve both students and administrators through the same operational source of truth.

These gaps justify the present project. The Group Management Portal is proposed not as a generic student portal, but as a specialized institutional operations platform for structured group-driven participation management.

## Chapter 2 Summary

This chapter reviewed prior work on student information systems, security, role-based access control, and event management systems. The survey showed that existing approaches each address part of the problem, but few integrate student groups, phases, eligibility, events, teams, auditability, and real-time visibility into one platform. This gap motivates the methodology and architecture chosen for the proposed solution.

# Chapter 3 - Objectives and Methodology

## 3.1 Chapter Introduction

This chapter explains how the Group Management Portal is designed and implemented. The methodology is presented from a software engineering perspective, beginning with objectives and stakeholder needs, then moving through requirements, architecture, data modeling, workflow logic, security design, real-time communication, scheduling, and validation. Since this project is an applied engineering solution, the methodology emphasizes practical design decisions rather than purely theoretical abstraction.

## 3.2 Objective Refinement

The high-level objectives stated in Chapter 1 can be refined into engineering goals. First, the system must centralize operational data without losing modular clarity. Second, the platform must support two distinct but connected user experiences: student and admin. Third, the backend must enforce rules consistently through middleware and service logic. Fourth, the application must remain maintainable as workflows expand. Fifth, the system must support historical and current-state views so that decisions can be traced over time.

These goals shape the methodology at every stage. For example, modular backend folders are used because the problem space includes many distinct entities. RTK Query and Redux are used because multiple screens need shared state and cached server responses. Socket.IO is adopted because operational changes should propagate without forcing continuous manual refresh. Scheduled jobs are used because phase transitions are date-dependent and should not rely on human follow-up alone.

## 3.3 Stakeholder Analysis

The project primarily serves three stakeholder groups:

**Students:** They need a transparent view of their current group, hubs, teams, event groups, requests, rankings, on-duty status, and eligibility history. Their expectation is self-service visibility and reduced dependency on manual clarification from administrators.

**Administrators:** They need operational control over group creation, membership, targets, phases, system settings, events, audit logs, and policy enforcement. Their expectation is centralized governance with enough visibility to make timely decisions.

**System Administrators / Technical Maintainers:** They need secure configuration, bootstrap access, deployment compatibility, and maintainable code structure. Their expectation is that the system remains operable, configurable, and extendable.

This stakeholder analysis guided the route separation, API design, and module decomposition seen in the current repository.

## 3.4 Functional Requirements

The major functional requirements of the system are as follows:

1. User authentication and secure session maintenance.
2. Group creation, update, activation, and discovery.
3. Membership management, including join, leave, role assignment, and rejoin rules.
4. Phase creation with dates, working-day calculations, targets, and change-day configuration.
5. Automatic phase activation and finalization.
6. Eligibility evaluation for individuals and groups based on points and configured targets.
7. Base-point recording and leaderboard generation.
8. Event creation, update, status management, round management, and participation counts.
9. Team, hub, and event-group creation and membership workflows.
10. Join request, invitation, leadership, and tier-change workflows.
11. Audit log access and operational history views.
12. Real-time notification and room synchronization.

## 3.5 Non-Functional Requirements

The system also depends on non-functional requirements:

- **Security:** Only authenticated users should access protected workflows, and permissions must follow role boundaries.
- **Consistency:** Operational rules such as target thresholds and activation conditions must be applied uniformly.
- **Scalability:** The architecture should support more entities, screens, and workflows without forcing a redesign.
- **Maintainability:** Code should remain understandable through modular separation into frontend pages/components and backend routes/services/repositories.
- **Usability:** Students and admins should navigate through role-appropriate interfaces with minimal ambiguity.
- **Responsiveness:** The client should support interactive filtering, cached reads, and timely updates.
- **Observability:** Audit logs, history tables, and status-based views should make system behavior reviewable.

## 3.6 Technology Stack Selection

The technology stack was selected to balance developer productivity, maintainability, and suitability for workflow-centric web applications.

**Frontend:** React is used to structure the UI around reusable components and route-based pages. React Router is used to organize role-specific navigation. Redux Toolkit and RTK Query support predictable shared state and efficient shared data retrieval. Vite is used for fast development startup and optimized production builds. Material UI and Tailwind-related utilities support UI composition.

**Backend:** Express is used to expose REST-style route groups. Business logic is organized into service and repository layers. MySQL is used because the project contains structured relational entities and transactional operations. Socket.IO adds real-time push support. Joi is used in some modules for request validation. `node-cron` supports scheduled sweeps.

**Security and Sessions:** JWT-based cookie sessions are used to authenticate API and real-time requests consistently.

The stack is appropriate for this project because the problem is operationally complex but structurally web-centric. It does not require heavy distributed infrastructure; it benefits more from a clear relational model and disciplined modular code.

## 3.7 Repository and Application Structure

The repository is divided into two standalone applications:

- `client/` for the Vite and React frontend.
- `server/` for the Express API, MySQL connectivity, scheduled jobs, and Socket.IO server.

This separation is methodologically sound because it decouples interface concerns from service concerns while still allowing the system to be deployed together. The frontend contains route definitions, shared UI, role-specific pages, data services, state slices, and utility hooks. The backend contains config loaders, middleware, job schedulers, route registrations, and domain modules under `server/modules/*`.

Measured at the time of review, the repository includes approximately 389 tracked source and support files, 255 files under `client/src`, 18 backend domain modules, 39 SQL table definitions, 33 admin route declarations, 24 student route declarations, roughly 37,419 lines in `client/src`, and about 20,910 backend source lines excluding `node_modules`. These counts indicate a non-trivial engineering effort and confirm that the portal has already moved beyond toy-project scale.

## 3.8 System Architecture

The system follows a layered web architecture. The presentation layer is the React frontend. The application layer is the Express server. The domain layer is made of module-specific services and repositories. The data layer is MySQL. A real-time layer based on Socket.IO provides scoped updates, and an automation layer handles phase scheduling and finalization. This architecture is appropriate because the system has both synchronous request-response actions and asynchronous status propagation requirements.

## 3.9 Frontend Methodology

The frontend methodology emphasizes role separation, modular UI composition, and shared data access. Admin pages and student pages are defined in different route files, which keeps navigation responsibilities clear. Each major functional area has its own page-level container and related component group. State is managed at two levels. Local component state supports form and interaction concerns, while Redux Toolkit supports shared slices such as profile, phase, admin notifications, and student membership. RTK Query is used in a hybrid manner through a shared API slice that wraps existing service functions, providing caching, tag invalidation, and consistent query hooks.

The frontend also includes session-aware behavior. The AuthContext checks the `/api/auth/me` endpoint, maintains session expiry tracking, clears client cache on logout, and connects or disconnects the realtime client based on authenticated state. This contributes to predictable user experience and reduces the chance of stale private state persisting after session loss.

## 3.10 Backend Methodology

The backend is organized around domain modules. Each module usually contains route, controller, service, repository, and schema files, with optional validation files. This pattern appears in modules such as `group`, `membership`, `phase`, `eligibility`, `event`, `team`, `hub`, `onDuty`, `audit`, `leadershipRequest`, `groupTierRequest`, `teamChangeTier`, and `teamTarget`.

This pattern is strong because it makes the backend understandable by responsibility. A future maintainer can usually find an operation by domain and then follow it from route to controller to service to repository. The downside is that some service files have become quite large, which suggests a future need for finer-grained decomposition. However, the current structure is still significantly better than a single monolithic backend file.

## 3.11 Database Design Methodology

A relational database is a natural fit for this project because the entities are highly structured and interdependent. Users map to students or admins. Students map to groups through memberships. Groups have ranks, points, eligibility states, and targets that depend on phases. Events relate to event rounds, allowed hubs, and event teams. Requests connect users, groups, and approval state. Such relationships benefit from normalized tables and indexed joins.

Core table categories include identity, groups, phases, eligibility, events and teams, governance, and review workflows. This schema design supports both current operational state and historical traceability. That is important because student operations are not purely present-state problems; many workflows require reviewing what happened in a previous phase or why a student became eligible at a particular time.

## 3.12 Authentication and Authorization Methodology

The project uses cookie-based JWT authentication. A token is generated after successful login and stored in an HTTP-only cookie. On protected routes, middleware verifies the token using the configured secret and checks expiry. The session expiration timestamp is exposed to the client so that the frontend can proactively clear user state when a session ends.

Authorization is handled through role-aware middleware and role-segregated routing. This reflects RBAC principles from the literature. The methodology is not simply "who are you?" but also "what role do you hold in this workflow context?" That distinction matters because a student should not accidentally access admin governance flows, and an admin should not receive unrestricted system-level behavior without explicit design.

## 3.13 Group and Membership Workflow Methodology

The group lifecycle methodology in the system goes beyond creation and deletion. A group has identity, tier, status, membership counts, leadership completeness, and point-related discovery fields. Activation depends on policy rules such as minimum and maximum member thresholds and, where configured, the presence of required leadership roles. This means that the platform encodes governance logic instead of relying on informal manual judgment.

Membership flows include joining, leaving, role assignment, and rejoin deadline enforcement. These workflows are central because nearly every other module depends on accurate membership state. Eligibility, event participation, leadership requests, and group rankings all assume that membership data is current. The methodology therefore treats membership as a foundational operational dataset.

## 3.14 Phase and Target Methodology

One of the most distinctive parts of the project is phase management. A phase is not just a date label; it is an operational window with start date, end date, start and end times, total working days, a configured change day, tier-specific group targets, an individual target, and a lifecycle status such as inactive, active, or completed.

The phase methodology includes working-day calculation, holiday awareness, change-day derivation, overlap prevention, and automated transition handling. This is a mature design choice because it recognizes that academic operations occur within structured review windows rather than vague ongoing timelines.

## 3.15 Eligibility and Points Methodology

Eligibility is computed using a target-driven approach. Students accumulate base points, and groups accumulate group points within a phase window. These totals are then compared against configured individual and group targets. The system stores eligibility snapshots and also derives multiplier-based awarded points for further ranking or performance analysis.

This methodology is strong for several reasons. First, it makes evaluation criteria explicit. Second, it separates raw activity points from eligibility-derived bonus points. Third, it supports history and auditability by storing evaluated results rather than recalculating everything invisibly every time. Fourth, it connects naturally to leaderboards and dashboard summaries.

## 3.16 Event, Team, and Hub Methodology

The event methodology supports event creation, status control, registration windows, maximum counts, membership limits, round schedules, and allowed hub restrictions. Teams are used as a generalized organizational structure, with hubs and event groups represented through type distinctions. This is a pragmatic model because it avoids duplicating too much structural logic while still allowing separate user experiences.

Event rounds are normalized, validated, and updated transactionally. Allowed hubs are checked for existence and status. Participation counts are synchronized after changes. These choices show that the system is engineered to protect consistency rather than merely accepting loosely structured event inputs.

## 3.17 Request and Review Methodology

Institutional operations frequently depend on approval chains. The project includes workflows for join requests, event join requests, leadership requests, group tier requests, and team change-tier flows. Such workflows are essential because not every student-initiated action should be applied immediately without review.

The methodology here emphasizes controlled transitions: a request is created, it enters a reviewable state, an authorized role evaluates it, the resulting state affects membership or configuration, and the action can be audited later. This makes the platform significantly more aligned with real institutional governance than a purely direct-action system would be.

## 3.18 Real-Time Communication Methodology

The realtime layer uses Socket.IO and room-based scoping. On connection, the server authenticates the user from the same cookie model used by the API. It then computes desired rooms based on user identity, role, student/admin scope, group memberships, and team memberships. This is a strong design because it allows the system to push updates only to relevant users instead of broadcasting everything globally.

Rooms such as `user:*`, `role:*`, `group:*`, and `team:*` are meaningful because operational changes are scoped. A leadership update is relevant to one set of admins, while a membership update is relevant to a particular group or student. The design aligns well with Socket.IO documentation on rooms and server-side room logic.

## 3.19 Scheduled Job Methodology

The project includes two background automation mechanisms: a phase-end scheduler that tracks pending phase jobs and due wake-up times, and a cron-based phase finalization sweep that catches up on expired phases. This methodology reduces human dependency and improves operational consistency. A phase should not remain active indefinitely because an administrator forgot to close it manually.

## 3.20 Validation Methodology

Validation in the current project is partly automated and partly manual. The frontend can be built successfully using the production build command, which confirms that the current source compiles into deployable assets. At the same time, linting currently reports a significant number of issues, especially around unused variables, fast-refresh export rules, and React effect patterns. The backend currently lacks a meaningful automated test suite, and its `test` script remains a placeholder.

Therefore, the current validation methodology can be summarized as production build verification for the frontend, static lint review for frontend code quality, runtime-oriented backend validation through manual testing and feature usage, and no established automated backend testing pipeline yet.

## 3.21 Detailed Workflow Scenarios

To understand the methodology more concretely, it is useful to describe how the system behaves in end-to-end scenarios.

**Scenario A: Student joins a group**  
A student logs into the portal and navigates to the group discovery area. The frontend retrieves visible groups and combines them with ranking data and any personal join-request history. The student selects a group and raises a join request. That request is stored in the backend and enters an approval workflow rather than immediately mutating membership state. An administrator later reviews the request through the appropriate admin queue. When approved, the membership tables are updated, and group-level views are refreshed. Because the system is realtime-aware, the affected user and related operational rooms can receive the change without depending solely on browser refresh. This scenario shows how discovery, request handling, membership control, and synchronization work together.

**Scenario B: Phase is configured and later finalized**  
An administrator creates a new phase by entering the phase name, start and end dates, time windows, change-day number, and target values. The backend validates that the phase window is meaningful, that required targets exist, and that the new phase does not overlap with an existing phase. If the phase is active immediately, any outgoing active phase is handled safely. After creation, phase-end scheduling logic stores the due timing. Once the end window is reached, the scheduler or cron sweep triggers phase finalization and eligibility evaluation. This means the institution does not depend on a person remembering to close the phase manually. The workflow shows that the platform is capable of handling time-bound governance as a system-level responsibility.

**Scenario C: Eligibility is evaluated**  
During or after a phase, the eligibility module aggregates base points for students and group points for groups within the phase window. These totals are compared with stored targets. Snapshot rows are written to the database, multiplier-derived awarded points are synchronized, and dashboards can later retrieve both current and historical views. If a completed phase has already been evaluated, the service can preserve stored results rather than reinterpreting them unsafely. This workflow is important because it demonstrates that the portal does not merely display progress; it formalizes evaluation outcomes as structured system records.

**Scenario D: Event is created and restricted by hub**  
An administrator creates an event with start date, end date, registration mode, allowed hubs, member limits, rounds, and descriptive information. The backend normalizes the payload, verifies event code uniqueness, validates rounds, checks allowed hubs, and writes related data transactionally. If the event later receives participants, some configuration changes become restricted to protect consistency. This shows thoughtful engineering because event configuration is not treated as infinitely editable after operational state has accumulated.

**Scenario E: Student consumes dashboard information**  
After login, the student dashboard can show group membership, current phase context, base points, eligibility status, teams, hubs, event groups, and leaderboard visibility. This information is not static content; it is built from multiple backend modules and cached shared queries. The dashboard therefore becomes a decision-support surface for the student rather than a decorative landing page.

These scenarios confirm that the methodology of the system is workflow-oriented from end to end.

## 3.22 Deployment and Operational Methodology

The development and operational methodology used in the repository is also worth documenting because it reflects how the system is expected to be installed and maintained.

The server and client are maintained as separate applications. This means a maintainer installs dependencies independently, configures independent environment files, and runs the backend and frontend in separate terminals or deployment processes. The backend expects explicit environment settings for database connectivity, JWT secrets, CORS origins, cookie behavior, and scheduler configuration. The frontend expects an API base URL. This separation is helpful because it keeps deployment flexible; however, it also requires stronger configuration discipline.

Database setup is handled through repository scripts rather than purely manual SQL execution. The server provides schema-application and performance-index scripts, which helps keep database setup repeatable. A bootstrap admin script is also provided, showing that initial access provisioning has been considered. This is a positive sign because operational readiness often fails when first-user creation is not formalized.

The server startup sequence is also noteworthy. On startup, it checks database connectivity, starts the phase scheduler, starts the cron-based phase finalization process, initializes realtime communication, and performs certain warm-up synchronization tasks. This indicates that the backend is designed to be an operational process rather than a stateless collection of request handlers. It has responsibilities that begin at process start and continue while the server is running.

From a deployment-quality perspective, this methodology is strong in structure but still needs future hardening. Production readiness would benefit from:
- environment validation in CI,
- migration/versioning discipline beyond schema replay,
- service health endpoints,
- centralized logging and alerting,
- structured rollback planning.

Even so, the current repository demonstrates a realistic operational mindset and not merely a local-demo mindset.

## Chapter 3 Summary

This chapter explained how the Group Management Portal is designed as a layered full-stack system with modular frontend and backend components, relational data modeling, JWT-based sessions, rule-driven workflow services, room-based real-time updates, and automated phase scheduling. The methodology shows that the project is intentionally engineered for academic operations rather than assembled as a disconnected set of forms. The next chapter presents the major work modules of the proposed system in detail.

# Chapter 4 - Proposed Work Modules

## 4.1 Chapter Introduction

This chapter explains the major implementation modules of the Group Management Portal. The purpose is not merely to list folders, but to show how each module contributes to the final workflow-oriented behavior of the system. The portal is valuable because its modules are connected. Groups influence eligibility, phases influence scoring, requests influence memberships, and events influence team structures. Understanding these modules as a coordinated system is essential to understanding the contribution of the project.

## 4.2 Authentication and Identity Module

The authentication module establishes the trust boundary of the platform. Users authenticate through `/api/auth`, and the backend generates JWT-based sessions stored in HTTP-only cookies. Middleware checks the cookie, verifies the token, validates expiry, and then attaches user information to the request context. The same session model is reused in the realtime socket layer, which prevents the system from creating two separate trust models for API calls and push communication.

From a user perspective, this module ensures that login is persistent but bounded by explicit session expiry. From an engineering perspective, it reduces duplicated session logic and keeps route protection consistent. Since the portal is role-sensitive, the identity model is not just about login success; it is about enabling safe feature segmentation across student and admin dashboards.

## 4.3 Group Management Module

The group module defines the institution's primary collaborative unit. Groups are created with identifiers, names, tiers, and lifecycle status. The system also derives operational discovery fields such as vacancy counts, captain information, and current eligibility visibility. These fields are not trivial decoration; they allow the frontend to present meaningful decision-ready data instead of raw table dumps.

The group activation workflow is especially important. Activation is not treated as a casual toggle. The service checks policy conditions such as minimum and maximum active members and, where configured, the existence of key leadership roles. This reflects a governance-first design. A group becomes active only when it satisfies institution-level readiness criteria, unless an authorized override is used.

The group module therefore serves multiple purposes:
- maintaining group identity,
- enforcing group lifecycle rules,
- powering group discovery for students,
- supporting governance-level review for administrators,
- providing context for rankings and eligibility.

## 4.4 Membership and Join Request Module

Membership is one of the most critical operational modules because it connects students to groups and therefore influences nearly every downstream workflow. The system stores membership state, role, status, and time-related information. It also supports join requests and rejoin restrictions, which are necessary in institutions where movement between groups must be controlled rather than immediate.

The portal's design shows a mature understanding of membership complexity. It distinguishes between current active membership and prior membership history. This is useful for auditability and for time-bound calculations, such as determining what group a student belonged to at a particular moment. The request-driven model also protects administrators from unstructured or undocumented membership changes.

## 4.5 Phase Configuration Module

The phase module is one of the strongest and most distinctive parts of the project. A phase acts as a bounded operational period during which targets apply and performance is evaluated. The service calculates working days while considering holidays, derives change-day positions, validates input times, prevents overlaps with existing phases, and computes status transitions based on real time.

This module shows that the project was built around actual institutional rules rather than generic dashboard concepts. Phase design allows the institution to define operational windows, communicate them clearly, and evaluate outcomes consistently at the end of each cycle. The backend also supports updating active phase settings and previewing working-day metrics, which improves administrative flexibility without giving up rule integrity.

## 4.6 Eligibility and Base-Point Engine

The eligibility module turns raw activity into rule-based academic or institutional status. Students accumulate base points. Groups accumulate group points. These are evaluated against configured thresholds for the current or specified phase. The system stores snapshots of individual and group eligibility, calculates awarded points based on multipliers, and exposes both summary and historical views.

This is a significant contribution because many student platforms stop at attendance or participation counting. The Group Management Portal goes further by formalizing evaluation. It can explain not only what a student's point total is, but also whether the student is eligible, what target applied, and how that affects dashboard summaries or leaderboards. The same applies at group level.

The module also supports admin-side student overview, dashboard summaries, phase timelines, and historical eligibility inspection. This broad coverage makes it central to the value of the portal.

## 4.7 Event Management Module

The event module manages event identity, schedules, registration windows, location, category, participation rules, rounds, allowed hub constraints, and event status. It supports both individual and team registration modes, validates rounds, preserves transactional consistency during updates, and synchronizes participation counts when configuration changes.

This module matters because student engagement often happens through events, competitions, and campus activities. A weak event system would fragment the platform. Instead, the present module integrates event data with teams, membership, eligibility, and request workflows. That integration is one of the system's strengths.

The existence of event rounds is also notable. Rather than treating events as single-point records, the system can model multi-stage competitions. This improves realism and allows the portal to support more serious institutional event scenarios.

## 4.8 Team, Hub, and Event Group Module

The project uses a generalized team concept with differentiated types such as team, hub, and event. This is a pragmatic engineering decision because it captures structural similarity while preserving user-facing distinctions. The system can therefore reuse parts of the data model and workflow logic while exposing appropriate context in different pages.

Teams support regular student collaboration. Hubs represent structured groupings with their own membership and management rules. Event groups act as event-specific team entities. The frontend provides separate screens for these categories, but the backend benefits from a shared conceptual model. This balance between reuse and clarity is good system design.

## 4.9 Leadership and Tier Review Module

Institutional group governance often depends on leadership completeness and performance-tier movement. The project includes leadership request workflows and group or team tier review paths. These modules make the system more realistic because they encode processes that are often handled informally in institutions.

By digitizing leadership and tier requests, the portal creates a documented approval trail and reduces ambiguity. It also allows related modules, such as activation logic and dashboard visibility, to depend on a consistent source of role truth instead of ad hoc manual corrections.

## 4.10 Team Target and Change-Day Administration Module

The project includes specialized admin screens and services for team target management and change-day management. These modules show that the system is not limited to broad CRUD operations; it includes operational fine-tuning tools for administrators who need to control institutional rules with precision.

The change-day management flow is especially useful in real settings because phase schedules may need operational adjustment. By exposing this through a dedicated interface and service path, the project acknowledges that institutions need controlled flexibility rather than rigid static configuration.

## 4.11 On-Duty and Student Activity Tracking Module

The on-duty module enables the system to track requests or proofs tied to student activity. This is relevant in institutions where participation in events or approved engagements interacts with attendance or internal credit. The presence of file upload handling for proofs suggests that the portal is prepared for workflow-backed evidence rather than text-only status changes.

This module broadens the usefulness of the system by connecting institutional participation and operational recognition, making the portal more than a group registry.

## 4.12 Audit Log and Governance Module

The audit module provides administrative visibility into system behavior. In governance-heavy systems, auditability is a necessity rather than a luxury. When administrators modify targets, activate groups, adjust settings, or review requests, those actions should be reviewable later. Audit trails help establish accountability, support debugging, and improve trust in the system.

The existence of a dedicated audit area in both backend schema and admin routes indicates that traceability was intentionally included in the design.

## 4.13 Student Dashboard and Discovery Module

The student-facing side of the portal is not merely a passive mirror of backend records. It is designed as an active workspace where students can discover groups, inspect event opportunities, view leaderboards, manage requests, track their own memberships, and monitor eligibility status. This design is important because user adoption depends heavily on whether students perceive the platform as useful for daily decision-making.

Features such as group discovery, leaderboard visibility, event pages, hub details, request centers, and personal membership views make the student dashboard practical. The project recognizes that a portal succeeds only when both sides of the system benefit from using it.

## 4.14 Admin Dashboard and Operations Module

The admin workspace includes group management, membership management, event management, student management, eligibility control, phase configuration, settings, holiday management, incubation configuration, audit logs, and request review screens. This breadth reflects the operational ambition of the project.

The admin route structure also shows deliberate separation of concerns. Instead of one overloaded dashboard component, the platform distributes work across dedicated page modules and related UI components. This makes the codebase more maintainable and helps administrators navigate functionally distinct areas with less confusion.

## 4.15 Realtime Synchronization Module

The realtime module is a distinguishing engineering feature. By assigning users to logical rooms based on identity, role, group, and team relationships, the system can deliver relevant updates with minimal noise. This is especially useful for request queues, status changes, membership updates, and dashboard refresh behavior.

The presence of a reusable realtime client and explicit room synchronization also indicates that the project was built with dynamic workflow awareness rather than purely page-refresh-based interaction.

## 4.16 Module Integration and Traceability

The real strength of the proposed work lies in module integration. Authentication gates access to every protected workflow. Membership determines group context. Group context influences eligibility and rankings. Phases define time windows for evaluation. Events create additional team structures. Requests mediate controlled change. Audit logs record governance actions. Realtime rooms propagate updates. The system therefore behaves like an integrated operations portal rather than a collection of isolated forms.

## 4.17 Route-Level Functional Mapping

The route structure of the application helps illustrate how comprehensively the modules have been translated into user-facing workflows.

### Admin-side route groups

The admin side includes functional areas for dashboard access, audit logs, group creation and editing, group details, event management, change-day management, settings, incubation configuration, holiday management, membership management, phase creation, phase history, eligibility management, student management, base-point management, team management, hub management, event-group management, team membership management, hub membership management, event-group membership management, team target management, event join requests, on-duty management, leadership management, and tier management.

This route diversity confirms that administrators are expected to operate the system in a role-driven way rather than through one oversized screen. It also shows that the project has translated backend services into interface-level operational tools.

### Student-side route groups

The student side includes dashboard access, my-group view, all-groups discovery, group details, team directory and team details, hub directory and hub details, events, event-group details, on-duty view, my-teams, my-hubs, my-event-groups, centralized request view, leaderboard, and eligibility history.

This route map is important because it reveals the design philosophy of the portal. Students are not treated as passive viewers of static records; they are given workflow visibility across groups, teams, hubs, requests, events, and rankings. That makes the system genuinely interactive and participation-focused.

## 4.18 Data Flow Across Modules

A useful way to understand the proposed work is to look at how data flows from one module into another.

When a student earns points, those values move into the base-point history and can contribute to phase-level eligibility evaluation. Eligibility outcomes can then affect dashboard summaries, phase histories, and group-level visibility. When a membership changes, the student's accessible group context changes, and that in turn affects which data is shown in discovery, ranking, or realtime rooms. When an event is configured with hub restrictions, the allowed-hub logic influences which teams may form or participate. When a phase ends, automation updates status and evaluation results, which can affect ranking and operational decision-making.

This interconnected data flow is a major positive aspect of the project because it shows that the platform has been designed around business relationships rather than isolated database tables.

## Chapter 4 Summary

This chapter detailed the proposed work modules that make up the Group Management Portal. The system includes identity management, group and membership workflows, phase scheduling, eligibility evaluation, event handling, teams and hubs, request processing, auditability, and realtime synchronization. The analysis shows that the project is both broad in operational coverage and reasonably cohesive in architectural design.

# Chapter 5 - Results and Discussion

## 5.1 Introduction

This chapter discusses the achieved implementation results, the observable strengths of the current system, the engineering limitations found during review, and the broader significance of the project in relation to the identified problem. Since the current work is a software implementation project, the results are interpreted in terms of workflow coverage, architectural quality, build-readiness, maintainability, and operational value.

## 5.2 Implementation Snapshot

At the time of review, the project presents the following concrete implementation indicators:

- 18 backend domain modules.
- 23 mounted API route prefixes in the Express application.
- 33 admin route entries and 24 student route entries.
- 39 SQL table definitions across schema files.
- Roughly 37,419 lines in `client/src`.
- Roughly 20,910 backend source lines excluding `node_modules`.
- A successful production frontend build through Vite.

These indicators confirm that the system is substantial in both UI and backend scope. The codebase is large enough to represent a realistic institutional portal rather than a minimal prototype.

## 5.3 Functional Results by Module

**Authentication:** The system successfully implements cookie-based JWT session handling for both API routes and realtime connections. This provides a unified trust boundary.

**Group governance:** The portal supports creation, editing, activation, freezing, and discovery of groups, with policy-aware activation conditions.

**Membership workflows:** Join, leave, and membership status logic are integrated with group state and student views, creating coherent lifecycle tracking.

**Phase operations:** The portal supports phase creation, working-day calculation, overlap prevention, and automatic lifecycle transitions.

**Eligibility:** The system evaluates both individual and group eligibility based on phase windows and target configurations, and exposes summary and history views.

**Events and teams:** Event creation, rounds, team structures, invitations, and request paths are operationally integrated.

**Admin visibility:** The admin workspace covers governance-heavy tasks such as audit logs, settings, phase history, student management, and multiple request types.

**Student visibility:** Students can view their current status, groups, teams, events, rankings, and personal history without depending entirely on manual admin communication.

## 5.4 Frontend Verification Result

The frontend production build completed successfully through `cmd /c npm --prefix client run build`. The build output shows that the application can be packaged into deployable static assets and that the codebase currently resolves successfully through the bundling pipeline. This is an important engineering milestone because it demonstrates that the application is not only source-complete but also distribution-capable.

The build output additionally shows clear code-splitting across multiple admin and student pages, which is beneficial for route-based loading and long-term maintainability. Chunked assets for areas such as event management, team management, membership management, leaderboards, and dashboards show that the client has been structured with practical route-level separation.

## 5.5 Static Quality Review Result

The lint result is currently mixed. On one hand, linting is active and therefore capable of revealing correctness and maintainability issues before runtime deployment. On the other hand, the current lint run reports 71 errors and 16 warnings. These issues fall into a few main categories:

1. unused variables and props,
2. React hook dependency warnings,
3. synchronous `setState` calls inside effects,
4. `useEffectEvent` rule violations,
5. fast-refresh export pattern problems,
6. a few empty block statements.

This result is valuable because it does not imply that the project is unusable; instead, it shows that the codebase has reached a level where formal cleanup and stabilization should become a development priority. The existence of these warnings is itself useful evidence for the review process.

## 5.6 Backend Verification Result

The backend currently does not contain a meaningful automated test suite. Running `cmd /c npm --prefix server test` returns the placeholder script `Error: no test specified` and exits with failure. This means backend reliability is presently dependent on manual verification, incremental feature testing, and runtime observation.

For an academic project this may still be acceptable at demonstration stage, but for institutional rollout it is a major improvement area. Because the backend contains important logic for eligibility, phase transitions, and request processing, the absence of automated tests increases regression risk.

## 5.7 Strengths of the Proposed Work

The project has several clear strengths:

**1. Strong domain coverage.**  
The portal does not stop at student records or event listing. It covers groups, memberships, phases, targets, eligibility, events, hubs, teams, requests, audit logs, and realtime updates in one coherent platform.

**2. Good modular backend structure.**  
Organizing business areas into route, controller, service, repository, and schema files makes the codebase easier to understand and extend.

**3. Meaningful institutional logic.**  
Features such as activation rules, change-day management, holiday-aware phase windows, and target-based eligibility reflect actual operational rules rather than superficial demo features.

**4. Dual-role value.**  
Both students and administrators benefit directly from the system. This significantly improves the practical relevance of the portal.

**5. Realtime readiness.**  
The use of room-based Socket.IO scoping shows thoughtful engineering for multi-user operational updates.

**6. Historical and audit-oriented design.**  
The system records history and state changes in ways that support traceability and review.

## 5.8 Limitations of the Proposed Work

The current implementation also has meaningful limitations:

**1. No automated backend tests.**  
This is the single most important technical gap because critical workflow logic remains unguarded against regression.

**2. Frontend lint debt.**  
The high number of lint errors suggests that code cleanup and React best-practice alignment are still in progress.

**3. Very large service files.**  
Some backend service files, especially in eligibility-related logic, are large enough to make future maintenance harder unless further decomposition is introduced.

**4. Limited operational observability.**  
Although audit logs exist, the system could benefit from more structured health metrics, failure tracking, and administrative diagnostics.

**5. No explicit test data or CI pipeline evidence.**  
The repository structure suggests strong implementation activity, but it does not yet demonstrate a fully automated quality pipeline.

## 5.9 Comparison with the Literature

Compared with the reviewed literature, the Group Management Portal performs well in integration breadth. Many systems in the literature centralize academic information or digitize event workflows, but fewer combine group structures, phase-based targets, role-aware workflows, and realtime updates. The project therefore compares favorably in terms of practical workflow integration.

Compared with security-focused studies, the project adopts a sound baseline through JWT sessions, role-based checks, and scoped room access. However, compared with mature enterprise-grade portal expectations, it still needs stronger automated testing, code-quality cleanup, and operational hardening.

Compared with generic event management systems, this project is stronger in contextual integration because events are connected to hubs, teams, and group workflows rather than treated as isolated records.

## 5.10 Significance of the Work

The significance of the project lies in its ability to translate institutional operations into software-enforced processes. Instead of depending on informal memory or manual reconciliation, the institution can rely on configured targets, stored histories, route protection, and automated lifecycle transitions. This increases transparency, reduces ambiguity, and improves consistency.

For students, the significance lies in visibility and self-service. For administrators, it lies in governance efficiency. For the institution, it lies in creating a digital operational backbone that can continue to evolve.

## 5.11 Cost-Benefit Analysis

The cost-benefit balance of the project can be summarized as follows:

**Costs**
- Development time for frontend and backend engineering.
- Database setup and environment configuration.
- Ongoing maintenance effort for bug fixing, schema evolution, and UI improvements.
- Future investment needed for testing, deployment hardening, and monitoring.

**Benefits**
- Reduced manual coordination effort.
- Faster and more transparent request handling.
- Better visibility into group, team, and event operations.
- Rule-driven eligibility and phase tracking.
- Improved auditability for admin actions.
- Better student experience through centralized information access.

For institutions that already manage these workflows manually, the benefits are likely to outweigh the software maintenance cost because the portal consolidates a large amount of repeated administrative work into one system.

## 5.12 Discussion

The overall discussion of the project is positive. The system has already crossed the threshold from concept to practical platform. The successful frontend build, breadth of route and module coverage, and depth of workflow logic all support that conclusion. At the same time, the project is at a transition point: the next stage of maturity should focus less on feature expansion and more on stabilization. Specifically, lint debt reduction, backend testing, and service decomposition would meaningfully increase maintainability and deployment confidence.

In summary, the current implementation solves a real institutional problem in a technically credible way, and the identified limitations are the kinds of issues typically seen when a useful product has grown rapidly and now needs structured refinement.

## 5.13 Detailed Engineering Review Matrix

For report discussion purposes, the review can be summarized using a practical matrix:

**Architecture:** Strong overall direction. The separation between frontend and backend applications, plus route/controller/service/repository patterns in the server, is a major advantage.

**Workflow realism:** Very strong. Features such as holiday-aware phases, change-day logic, target-based eligibility, and request queues are clear signs of domain understanding.

**Build readiness:** Good on the frontend because production build succeeds. Moderate overall because backend automated verification is still weak.

**Code hygiene:** Mixed. The codebase is active and functional, but lint debt indicates a cleanup phase is needed.

**Security posture:** Reasonable baseline through cookie-based JWT authentication, role checks, and scoped realtime rooms. Future improvement should include stronger test coverage and perhaps more explicit hardening around error and audit scenarios.

**Maintainability:** Good structural base, but some service files are becoming too large and should be refactored before further feature growth.

**User value:** High. The system provides real functionality to both administrators and students, making it more practical than many one-sided academic systems.

This matrix reinforces the conclusion that the project is strong in system design and feature integration, and that its main challenges are maturity-oriented rather than concept-oriented.

## Chapter 5 Summary

This chapter showed that the Group Management Portal achieves broad operational coverage and meaningful workflow integration. It also highlighted current strengths such as modular architecture, rule-aware design, and dual-role usefulness, while identifying important technical gaps such as missing backend tests and frontend lint debt. These findings provide a balanced basis for the final conclusions in the next chapter.

# Chapter 6 - Conclusions and Suggestions for Future Work

## 6.1 Conclusion

The Group Management Portal successfully addresses the central problem identified in this report: the lack of a unified digital platform for managing student groups, memberships, phase targets, eligibility evaluation, event participation, request workflows, and administrative oversight. The project brings these functions together within a full-stack architecture built on React, Express, MySQL, Redux Toolkit, and Socket.IO. In doing so, it transforms fragmented institutional workflows into structured, rule-driven, and visible processes.

The codebase demonstrates that the project has real implementation depth. It includes multiple user roles, modular backend services, structured schema design, scheduled jobs for phase finalization, and realtime room-based communication. The frontend has been organized into clear student and admin workspaces, and the backend maps major institutional concerns into dedicated modules. This indicates that the project is not only conceptually sound but also practically engineered.

The review of the system also reveals that the project is already useful in its present form. It can reduce manual coordination, improve transparency, and provide a single operational source of truth for many institution-level activities. At the same time, the review identifies the natural next steps needed for software maturity: automated backend tests, lint cleanup, further decomposition of very large services, and stronger deployment observability.

Overall, the Group Management Portal is a strong academic and engineering project because it solves a real administrative problem, demonstrates meaningful full-stack integration, and offers clear potential for institution-scale evolution.

## 6.2 Suggestions for Future Work

The following enhancements are recommended for future development:

1. Add automated backend tests for authentication, phase transitions, eligibility evaluation, and request workflows.
2. Resolve frontend lint issues and align custom hooks more closely with current React best practices.
3. Introduce CI-based verification for build, lint, and automated tests.
4. Break very large service files into smaller domain-focused units to improve maintainability.
5. Add richer analytics dashboards for administrators, including trend charts and comparison metrics across phases.
6. Introduce notification centers with persisted read and unread states.
7. Add export options for operational reports such as CSV or PDF.
8. Improve monitoring and observability with structured logging and health dashboards.
9. Extend the system for mobile-responsive optimization or a dedicated mobile app.
10. Support multi-department or multi-institution deployment if required by future scaling plans.

## 6.3 Final Summary

This project demonstrates how a workflow-centric campus operations platform can be constructed through modular full-stack engineering. By combining access control, relational data modeling, automated schedules, and realtime updates, the Group Management Portal provides a practical and extensible foundation for modern student group governance. Its current strengths make it a successful project implementation, and its current limitations point clearly toward the next stage of refinement.

# References

[1] Ferraiolo, D. F., & Kuhn, D. R. (1992). Role-Based Access Controls. 15th NIST-NCSC National Computer Security Conference.

[2] Sandhu, R., Ferraiolo, D., & Kuhn, R. (2000). The NIST Model for Role-Based Access Control: Toward a Unified Standard. National Institute of Standards and Technology. https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=916402

[3] Coyne, E. J., Weil, T. R., & Kuhn, D. R. (2011). Role Engineering: Methods and Standards. *IT Professional, 13*(6), 54-57. https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=909664

[4] Lubanga, S. C., Chawinga, W. D., Majawa, F., & Kapondera, S. (2018). Web based student information management system in universities: experiences from Mzuzu University. SCESCAL Conference Contribution. https://pure.royalholloway.ac.uk/en/publications/web-based-student-information-management-system-in-universities-e/

[5] Falebita, O. (2022). A Secure Web-Based Student Information Management System. *International Journal of Scientific Research in Computer Science, Engineering and Information Technology*. https://www.semanticscholar.org/paper/A-Secure-Web-Based-Student-Information-Management-Falebita/

[6] John, H. A., Augustine, J., Shareef, M., Muhamed, N., & Sunitha, E. V. (2022). Student Information Management System. *International Journal of Engineering Research & Technology*. https://www.ijert.org/student-information-management-system

[7] Shah, B., Acharya, S., Gajjar, D., Patel, M., & Patel, P. (2023). Event Management Systems (EMS). *Journal of Applied Technology and Innovation*. https://jati.sites.apiit.edu.my/files/2023/09/Paper_5-Event_Management_Systems-EMS.pdf

[8] Kifaru, W. M., Msoffe, P. L., & Mwasaga, F. (2023). Assessment of the Impacts of Cyber Security on Student Information Management Systems in Selected Higher Learning Institutions. *East African Journal of Information Technology*. https://www.multiresearchjournal.com/arclist.php?book=171&journal=122

[9] Shelke, S., Gaikwad, P., Ghadge, P., Joshi, R., & Kute, A. (2025). Student Management System: A Web-Based Solution for Academic Administration. *International Journal for Research in Applied Science and Engineering Technology*. https://www.ijraset.com/research-paper/student-management-system-a-web-based-solution-for-academic-administration

[10] Internet Engineering Task Force. (2015). RFC 7519: JSON Web Token (JWT). https://www.rfc-editor.org/rfc/rfc7519

[11] Internet Engineering Task Force. (2011). RFC 6455: The WebSocket Protocol. https://www.rfc-editor.org/rfc/rfc6455

[12] React. (2026). useEffect. https://react.dev/reference/react/useEffect

[13] React. (2026). useEffectEvent. https://it.react.dev/reference/react/useEffectEvent

[14] React Router. (2026). React Router Official Documentation. https://reactrouter.com/

[15] Redux Toolkit. (2026). RTK Query Overview. https://redux-toolkit.js.org/rtk-query/overview

[16] Express.js. (2026). Routing. https://expressjs.com/en/guide/routing.html

[17] Socket.IO. (2026). Rooms. https://socket.io/docs/v4/rooms/

[18] Oracle. (2026). MySQL 8.0 Reference Manual. https://dev.mysql.com/doc/refman/8.0/en/introduction.html

[19] Vite. (2026). Getting Started. https://vite.dev/guide/

# Appendices

## Appendix I - Bill of Materials

### Software
- Operating System: Windows development environment
- Frontend Framework: React 19
- Routing Library: React Router 7
- State Management: Redux Toolkit and RTK Query
- HTTP Client: Axios
- Realtime Library: Socket.IO client and server
- Backend Framework: Express 5
- Database: MySQL 8
- Build Tool: Vite 7
- Validation Library: Joi
- Scheduler: node-cron
- Development Utilities: nodemon, ESLint

### Hardware
- Developer machine with 8 GB or more RAM
- Multi-core processor
- Persistent local storage for code and database
- Network connectivity for development dependencies and documentation

## Appendix II - Coding (Selected Implementation Notes)

### Example 1: Central Store Structure

The Redux store combines local slices for profile, phase context, student membership, and admin notifications with a shared RTK Query API slice. This design reduces duplication and makes cross-page data access more predictable.

### Example 2: Express Route Mounting

The backend mounts dedicated route prefixes for authentication, groups, membership, phases, eligibility, events, teams, hubs, audit logs, system configuration, and multiple request workflows. This supports domain-oriented separation.

### Example 3: Phase Finalization Automation

The phase scheduler and cron-based finalization sweep show that the portal supports operational automation rather than relying entirely on manual admin actions.

## Appendix III - Standard Tables and Graphs for Final Report Formatting

The final formatted version may include the following visual elements:
- System architecture diagram
- Database entity relationship diagram
- Authentication flow chart
- Phase lifecycle flow chart
- Eligibility evaluation flow chart
- Event registration workflow chart
- Admin-versus-student feature comparison table
- Lint and verification status summary table

### Suggested Figure Captions and Supporting Notes

**Figure 3.1 - Overall system architecture**  
This figure should show the React frontend, Express backend, MySQL database, realtime Socket.IO layer, and scheduler components. The caption may explain that the frontend interacts with the backend through authenticated HTTP requests while realtime updates travel through socket rooms. The backend simultaneously handles transactional database work and automated lifecycle jobs.

**Figure 3.2 - Frontend navigation architecture**  
This figure can show the separation between shared pages, student routes, and admin routes. The intent is to demonstrate that the portal is not a single undifferentiated UI but a role-aware application with route groups mapped to stakeholder responsibilities.

**Figure 3.3 - Backend modular architecture**  
This figure should represent route, controller, service, repository, and schema layers. A brief caption can explain that request entry, business logic, persistence logic, and schema definition are intentionally separated to improve maintainability.

**Figure 3.4 - Authentication and authorization flow**  
This figure can illustrate login, token generation, cookie storage, middleware verification, request authorization, and logout. It should show that both HTTP APIs and realtime socket connections rely on the same session model.

**Figure 3.5 - Database interaction flow**  
This figure may trace how a route request reaches a controller, which then invokes a service, which in turn uses a repository to query or mutate the database. It can highlight transactional operations for events or eligibility snapshots.

**Figure 3.6 - Phase lifecycle and automation**  
This diagram can describe phase creation, due scheduling, active monitoring, cron sweep, phase finalization, and eligibility evaluation. It should emphasize that lifecycle automation reduces manual dependency.

**Figure 4.1 - Group and membership workflow**  
This figure can show student discovery, join request creation, admin review, membership update, and dashboard visibility refresh.

**Figure 4.2 - Eligibility and points workflow**  
This should show base-point collection, phase-window filtering, target comparison, snapshot creation, multiplier calculation, and dashboard output.

**Figure 4.3 - Event workflow**  
This may show event creation, round setup, allowed-hub assignment, student participation, team creation, and status review.

**Figure 4.4 - Realtime room synchronization model**  
This can display room membership based on user, role, group, and team scope. The caption can clarify that targeted emissions reduce unnecessary broadcast traffic.

### Suggested Table Content for Final Formatting

**Table 3.1 - Functional requirements**  
Columns can include requirement ID, description, stakeholder, priority, and implemented module. Example rows include secure login, phase creation, group discovery, request approval, and audit visibility.

**Table 3.2 - Non-functional requirements**  
Columns can include category, implementation strategy, and project evidence. For example, security is supported by JWT cookies and middleware; maintainability is supported by modular folders; responsiveness is supported by Vite, RTK Query, and route splitting.

**Table 3.3 - Technology stack justification**  
This table should map each technology to its purpose and justification. For example, React for component-driven UI, Express for modular HTTP APIs, MySQL for relational consistency, and Socket.IO for scoped realtime updates.

**Table 3.4 - Module responsibility map**  
Columns can include module name, major responsibilities, dependent modules, and user-facing impact. This table is useful because it visually explains the architecture to examiners.

**Table 3.5 - Database entities**  
This table can list major tables, their purpose, and key relationships. Example rows include `users`, `students`, `sgroup`, `memberships`, `phases`, `events`, and `audit_logs`.

**Table 5.1 - Verification results**  
This table can document the production build result, lint result, backend test status, and interpretation. A clear presentation of both strengths and shortcomings improves report credibility.

## Appendix III-A - Sample Filled Tables

### Sample Table: Technology Stack Justification

| Technology | Project Use | Reason for Selection |
| --- | --- | --- |
| React | Frontend user interface | Component-based design, large ecosystem, route-friendly structure |
| React Router | Client-side navigation | Clean separation of admin and student route trees |
| Redux Toolkit | Shared state management | Predictable store setup and slice-based logic |
| RTK Query | Shared data fetching | Built-in caching, tag invalidation, and query hooks |
| Express | Backend API server | Lightweight and flexible modular routing |
| MySQL | Relational data storage | Suitable for normalized operational entities and transactions |
| Socket.IO | Realtime communication | Scoped room-based updates for multi-user workflows |
| Vite | Frontend development and build | Fast local startup and optimized production build |
| node-cron | Scheduled automation | Useful for phase finalization sweeps |
| Joi | Request validation | Structured validation in selected workflows |

### Sample Table: Verification Summary

| Check | Result | Interpretation |
| --- | --- | --- |
| Frontend production build | Passed | Client compiles into deployable static assets |
| Frontend lint | Failed with 71 errors and 16 warnings | Code quality cleanup required before stabilization |
| Backend tests | Not implemented | Regression risk remains high for core business logic |
| Route coverage | Strong | Broad admin and student workflow support is present |
| Schema coverage | Strong | Data model includes identity, groups, phases, eligibility, events, and governance |

## Appendix IV - Publication Certificate

If the project has been presented or published, attach the publication certificate here. If not applicable, mark this section as **Not Available at Submission Stage**.

## Appendix V - Publication Proof

If the project has been published or accepted in a conference or journal, attach the first page of the publication or official proof here. If not applicable, mark this section as **Not Available at Submission Stage**.

## Appendix VI - Work Contribution

| Team Member | Major Contribution Areas |
| --- | --- |
| Student 1 | Frontend route structure, dashboard integration, UI workflows, report consolidation |
| Student 2 | Backend API modules, database schema handling, request workflow implementation |
| Student 3 | Phase logic, eligibility engine support, testing and deployment verification |

Replace the above with the actual contribution matrix of the project team.

### Expanded Contribution Narrative

In the final submitted report, the contribution matrix can be expanded into short paragraphs under each student name. For example, one member may have owned frontend route composition, UI states, and dashboard integration. Another may have handled Express module design, SQL schema application, and request-flow logic. A third may have concentrated on phase handling, eligibility evaluation, or test/build verification. The important requirement is that the written contribution narrative must remain honest and specific.

The project is broad enough that contribution can be divided by module ownership, by layer ownership, or by workflow ownership. What matters is that the report clearly explains who contributed to which part of the system and how the team coordinated the final integration. This is especially valuable in projects like this one, where architecture, business logic, and UI all require meaningful engineering effort.

## Appendix VII - Plagiarism Report

Attach the plagiarism report in the final submitted version. Ensure the report clearly shows the student name(s) and the project title.

# Submission Checklist Based on the Excel Workbook

The second worksheet in the Excel file lists the chapter and annexure order expected during submission. The current draft already follows that order:

1. Cover Page
2. Inner Title Page
3. Bonafide Certificate
4. Bonafide Certificate from Industry (if applicable)
5. Declaration
6. Acknowledgement
7. Abstract
8. Table of Contents
9. List of Tables
10. List of Figures
11. Abbreviations and Nomenclature
12. Chapter 1 - Introduction
13. Chapter 2 - Literature Survey
14. Chapter 3 - Methodology
15. Chapter 4 - Results and Discussion / Proposed Work Modules
16. Chapter 5 - Conclusions and Suggestions for Future Work
17. References
18. Appendices
19. Publication / Publication Proof (if available)
20. Plagiarism Report

# Final Formatting Alignment Notes

To match the first worksheet of the Excel file more closely, the final submitted report should be formatted with the following editorial rules:

1. Keep the abstract concise, complete, and close to the stated word expectation.
2. Do not place literature survey content inside the introduction.
3. Use recent literature and keep all survey writing in your own words.
4. Ensure all tables and figures are cited inside the chapter text before or immediately after they appear.
5. Avoid redundant screenshots or unnecessary internet images. Prefer workflow diagrams and original tables.
6. Ensure the chapter sequence remains stable from introduction through conclusion.
7. Keep references consistent in one citation style throughout the report.
8. Ensure front-matter placeholders such as student names, department, institution, and guide information are corrected consistently across cover page, declaration, and bonafide sections.
9. If the final report is prepared for print submission, verify line spacing, page breaks, and caption numbering only after all content is frozen.
10. Add final page numbers in the table of contents, list of tables, and list of figures after the document is moved into Word or another word processor.

These notes do not replace the actual college format sheet, but they help ensure that this draft aligns with the intent of the workbook you provided.
