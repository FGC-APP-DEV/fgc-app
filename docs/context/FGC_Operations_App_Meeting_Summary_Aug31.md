# FGC Operations App --- MVP Scope, Architecture & Workstream Alignment

## Executive Summary

The meeting reviewed the current proof of concept for the FGC operations
application and aligned on how to move it toward a usable MVP for the
competition.

Gregory demonstrated a substantial working prototype covering **Filming,
Judging, Judge Advisor, Admin/Pit Admin, paging, team scheduling, role
management, announcements, and authentication**. The prototype
establishes a strong technical foundation, but the main conclusion was
that the current scope is too broad for a first production deployment,
particularly for judges who will already be operating under significant
time pressure during the event.

The project will therefore prioritize **simplicity, reliability, and
real-world validation**. Gregory will focus primarily on the **Filming
module**, while João will take ownership of the **Judging experience and
repository/development organization**. The team will establish a cleaner
Git workflow, preserve the current stable prototype, and develop new
functionality through a dedicated development branch and isolated
feature/module work.

The immediate objective is to deliver a **minimum viable product that
can be demonstrated and, ideally, tested during the competition**,
gather operational feedback, and use those findings to drive a more
complete future version. Additional concerns to address include
mentor/pager feasibility, multilingual support, data security, data
deletion after competitions, and eventual infrastructure scaling.

## Observations

-   Gregory has already built a substantial proof of concept with
    several functional modules.
-   The **Filming module is currently the most mature area** and is the
    strongest candidate for an initial production-quality workflow.
-   The current Judging/Judge Advisor functionality is useful but
    potentially **too complex for judges to learn and operate during the
    competition**.
-   Requiring extensive training to use the app would significantly
    reduce adoption.
-   The first release should minimize additional cognitive load for
    judges.
-   **Team schedule lookup** was identified as one of the most valuable
    judging capabilities, especially the ability to search a team and
    understand whether it is currently available or competing.
-   The **pager functionality** could be highly valuable, but its
    usefulness depends on mentors actually having access to the
    application and on FGC operational support.
-   Real-world usage during the competition is important for collecting
    feedback and discovering operational/technical issues.
-   Support during the event is a concern because both João and Gregory
    are expected to have other responsibilities and may not be available
    to troubleshoot extensively.
-   The application should therefore favor **robustness and simplicity
    over feature completeness** for the first deployment.
-   React Native was discussed as the preferred direction because it
    allows the team to target mobile platforms from a common codebase
    and provides access to native capabilities such as notifications.
-   The existing repository has accumulated too many branches, creating
    unnecessary complexity.
-   Internationalization is valuable because FGC has participants from
    many countries; English alone may not be sufficient.
-   The current infrastructure is largely running on **free-tier
    services**, including Supabase and Resend, with deployment/domain
    infrastructure also currently inexpensive or free.
-   A working MVP should make it easier to justify requesting
    infrastructure budget from FIRST later.
-   Judging data creates a specific **security and data-retention
    requirement** because notes, award nominations, flags, and team
    information can be sensitive.
-   Competition data should eventually support a defined **hard-deletion
    process after the event**.

## Decisions (what was committed)

-   The project will move toward a **smaller and simpler MVP** rather
    than attempting to productionize every existing prototype feature.
-   **Filming and Judging will be the primary development workstreams.**
-   Gregory will primarily own and continue development of the **Filming
    module**.
-   João will primarily own the **Judging module** and the related
    judging workflow definition.
-   João will also handle the initial **GitHub/repository organization
    and development workflow**.
-   The current stable application will be preserved rather than
    continuously modified directly.
-   A **`dev` branch** will become the integration/development base for
    ongoing work.
-   New work should be isolated so Gregory and João can develop their
    respective modules without interfering with one another.
-   Changes will later be merged through coordinated integration
    sessions.
-   Gregory will first verify whether `main` actually contains the
    latest version before old branches are deleted.
-   Gregory committed to checking outstanding branches and informing
    João once the repository is safe to reorganize.
-   The team agreed that **React Native is the appropriate technical
    direction** for the application.
-   Multilingual support is desirable, with **English, Spanish, French,
    and Arabic** identified as the initial target languages.
-   Internationalization is useful but **secondary to completing the
    core MVP**.
-   The initial MVP should continue using low/no-cost infrastructure
    where practical.
-   Infrastructure can be upgraded after demonstrating a functional MVP
    and obtaining organizational support/budget.
-   Data security, encryption, retention, and post-event deletion need
    to become explicit technical requirements for the Judging module.

## Next Steps (action items set)

-   **Gregory:** Verify which Git branch contains the actual latest
    version and merge any missing changes into the stable baseline
    before repository cleanup.
-   **Gregory:** Notify João when the repository is ready for branch
    cleanup/reorganization.
-   **João:** Clean up the GitHub branching strategy once Gregory
    confirms the latest code is safely preserved.
-   **João:** Create/configure the `dev` development branch and
    establish the workflow for creating isolated feature/module
    branches.
-   **Gregory:** Continue developing and stabilizing the **Filming
    module**.
-   **João:** Define and simplify the **Judging MVP**, identifying only
    the functionality judges genuinely need during the event.
-   **João:** Prioritize investigation of **team schedule lookup** as a
    core judging feature.
-   **Team:** Determine whether **pager functionality** is operationally
    feasible by confirming how mentors will access the application.
-   **Team:** Engage relevant FGC/Pit Admin stakeholders if necessary to
    confirm app rollout, mentor onboarding, training, and operational
    support.
-   **Gregory:** Review Alberto's previously provided feedback and
    incorporate relevant items into the backlog.
-   **Team:** Add internationalization to the backlog, targeting
    English, Spanish, French, and Arabic without allowing it to block
    the MVP.
-   **João:** Research Supabase/security capabilities for sensitive
    judging information.
-   **João:** Define requirements for encryption/access control and
    **hard deletion of competition/team data after an event**.
-   **Team:** Plan another synchronization/integration meeting around
    the end of the week or following week to review progress and merge
    work where appropriate.

## Details

### Current proof of concept

Gregory presented the application developed during the previous months.
The prototype is already significantly beyond a basic mockup and
contains working workflows, authentication, database integration,
role-based functionality, and several operational modules.

Authentication currently uses an email/magic-link approach with users
expected to be whitelisted or provisioned beforehand.

The prototype demonstrates that the overall application concept is
technically feasible and provides a concrete foundation rather than
requiring the team to start from scratch.

### Filming module

Filming is currently the most mature module and the area Gregory
understands operationally best.

Its main objective is to help the production/filming staff track which
national teams have already been captured during the competition.

Teams can be represented with statuses such as **Captured, Pending, or
Skipped**, with filtering by status and geographical region.

The module also provides progress visibility so staff can understand
overall filming coverage.

A **Shot List** allows the production team to define specific required
shots or event moments and track their completion. Individual staff
members can focus on the shots assigned or relevant to them.

A pager capability also exists with filming-specific presets.

Because this workflow is already relatively advanced and solves a
concrete operational problem, the meeting identified it as a strong
candidate for the first polished component of the MVP.

### Judging module

The current Judging prototype allows judges to see their assigned panel
and teams.

Judges can record notes, nominate teams for awards, flag teams or
situations for Judge Advisor attention, and save drafts.

Pager functionality includes judge-specific presets such as requesting a
team for an interview or directing them toward another operational area.

The prototype also includes team/match schedule information.

João identified **schedule visibility as potentially one of the
strongest adoption drivers**: judges frequently need to know whether a
team is available or currently involved in a match.

However, the current Judging experience exposes too many capabilities
for an initial deployment.

The key design requirement going forward is:

**The application must reduce the judge's workload rather than introduce
another operational system they need to manage.**

If significant training is required to understand the workflow, the MVP
is too complex.

### Judge Advisor functionality

The Judge Advisor prototype supports creation of judging panels and
distribution of judges and teams between those panels.

Teams can be distributed automatically and manually moved between panels
when conflicts or other considerations exist.

Judge Advisors can review flags generated by judges.

The awards workflow aggregates nominated teams and provides visibility
into how many judges nominated a team.

Flags can also be surfaced alongside nominations to provide additional
context.

The system can transition into a second judging round and simplify what
regular judges see based on the teams/awards still under consideration.

These capabilities are potentially valuable but require additional
validation from experienced judging stakeholders before becoming part of
the MVP.

### Admin/Pit Admin functionality

The prototype includes administrative functionality such as team/venue
visualization, announcements, mentor codes, paging history, quick paging
presets, and role management.

Administrators can send announcements broadly or target teams.

Mentor access codes can be regenerated when necessary.

Role management allows administrators to assign application permissions
and identify users who have not completed their initial sign-in.

While useful, this module introduces substantial operational
dependencies.

João therefore proposed that Admin/Pit Admin should **not automatically
be considered part of the first production scope**. It should remain
dependent on confirmation from FGC operational stakeholders.

### Pager and mentor access

Paging could be one of the application's highest-value features because
it connects judges, filming staff, administrators, and teams.

However, it creates an important dependency: **mentors must reliably
have access to the application and receive the messages.**

Before the team invests heavily in the pager workflow, it needs
confirmation about onboarding, mentor access, connectivity, notification
delivery, and who within FGC operations will support its rollout.

If these conditions cannot be guaranteed for the first release, pager
functionality should be reduced or removed from the MVP rather than
introducing an unreliable critical workflow.

### MVP philosophy

The meeting converged around an explicit MVP-first strategy.

The objective is not to deploy every feature already conceived. Instead,
the team should deploy the **smallest application that provides obvious
operational value and can survive actual competition conditions**.

This is particularly important because João and Gregory will both have
responsibilities during the event and cannot act as full-time production
support engineers.

A smaller scope reduces training requirements, failure modes, support
requirements, and integration risk.

The competition can then serve as a controlled real-world validation
opportunity.

### Feedback-driven evolution

Getting the application into users' hands is itself an important
milestone.

If judges and other stakeholders use a limited version during the event,
the team can collect concrete feedback about usability, missing
functionality, performance, and unexpected operational situations.

Those findings can inform a substantially stronger version for the
following year.

Issues discovered during the event should also be captured
systematically rather than relying on memory after the competition.

### React Native architecture

React Native was discussed as the preferred architecture for moving
forward.

The main benefit is maintaining a shared application/codebase rather
than independently implementing web, Android, and iOS applications.

Native/mobile capabilities---particularly notifications---also become
easier to integrate.

The proposed source structure can separate concerns by domain/module,
for example authentication, common application functionality, filming,
judging, and administration.

This modular organization also aligns naturally with the planned
division of ownership between João and Gregory.

### GitHub and branching strategy

The repository currently contains many branches, which João identified
as an unnecessary source of confusion and potential integration
problems.

Before changing anything, Gregory will verify whether `main` truly
represents the latest complete version because some recent changes may
exist only on another branch.

Once confirmed, the intended model is roughly:

-   `main` → preserved stable baseline / release-quality application
-   `dev` → ongoing integration branch
-   Feature/module branches → isolated development work derived from
    `dev`

This will allow Gregory to work independently on Filming while João
works on Judging without either workstream destabilizing the other.

Periodic merges/integration meetings can then reconcile both streams.

### Internationalization

Because FIRST Global is an international competition, multilingual
support was identified as an important usability capability.

The initial languages discussed were **English, Spanish, French, and
Arabic**.

Existing internationalization libraries should make implementation
relatively straightforward.

Nevertheless, the team agreed this should not delay the critical MVP
functionality. It remains on the backlog and can be implemented as time
permits.

### Infrastructure and costs

Gregory explained that the current prototype is largely operating using
free-tier services.

Supabase is being used for database/backend functionality, Resend is
being used for email-related capabilities, and deployment/domain costs
are currently minimal or covered through free/trial programs.

This is appropriate for the MVP stage.

The strategy is to first demonstrate that the application works and
provides real operational value. Once that evidence exists, requesting
budget from FIRST for production infrastructure should be significantly
easier.

### Security and sensitive judging data

João raised an important requirement around judging information.

The application may contain confidential or sensitive competition data,
including judge notes, flags, award nominations, and information about
individual teams.

This means the Judging module cannot be treated as an ordinary CRUD
application.

The team needs to investigate appropriate **access controls, encryption,
data isolation, and retention policies**.

Supabase capabilities should specifically be evaluated against those
requirements rather than assuming the default configuration is
sufficient.

### Post-competition data deletion

Judging/team data should not remain indefinitely in the system.

João highlighted the requirement to remove collected team information
after each competition.

The architecture should therefore support a defined **end-of-event purge
process**, ideally capable of hard-deleting competition-specific
sensitive records rather than simply hiding or soft-deleting them.

This requirement should be designed into the data model and operational
procedures before the Judging module is considered production-ready.

### Immediate project direction

The project now effectively has two parallel tracks:

**Gregory → Filming:** stabilize and polish the strongest existing
module into a demonstrable/usable MVP capability.

**João → Judging + Engineering Operations:** simplify the judging
experience, determine its essential workflows, reorganize Git
development practices, and investigate security/data lifecycle
requirements.

Both workstreams can proceed independently and then be integrated
through the new development workflow.

The next project checkpoint should evaluate how much progress has been
made toward a **small, stable, competition-ready MVP**, rather than
measuring progress by the total number of implemented features.
