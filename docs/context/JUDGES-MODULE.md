Robotics competition app with an evaluation system in which:

\- Judges collaboratively evaluate a team to compete for various prizes and can later re-evaluate a team in their pit for a specific prize.   
\- Teams (through their mentors) can check the times they will be evaluated and submit supplementary files for evaluation.  
\- Everyone can check match times, emergency contacts, and support during the competition through a common dashboard on the landing page.

App features:  
\- Dashboard/landing page  
\- Team/mentor page  
\- Notification of when judges will be in the pit for interviews (if they come and the team is not present, the judges can send a notification of when they will return)  
\- Automatically checks the match schedule (and other team events) and suggests times  
\- Submit the rank/scores of the teams  
\- If a team is duplicated in the same position (for different awards), a warning should appear (and Judge Advisor will see and ask judges to decide \- feature idea: automatically rank such teams accordingly)  
\- Filter matches  
\- (Basic) instructions \- the ones Judge Advisor gives in pre-competition meetings \- come first in the home page  
\- Once teams get to the event, they are requested to submit a picture/video of their robot to put on the app (easy for the judges to check) (further and identify the team)\*  
\- Judges Award submissions and voting (+ explanation \-\> forms Carol)  
\- Feedback page  
\- Track the teams the panel has:  
  \- N judges can evaluate N teams, a team MUST be evaluated for N awards only once, a team can be evaluated in its pit for a specific award N times and for different specific awards. (e.g., Team A must be evaluated overall once by a panel of judges, then Team A can be evaluated again by one panel of judges for award X and by another panel of judges for award Y)

Roles and functions:

The Judge Advisor (and Judge Assistant) can:  
\- View the Awards and set separate groups/panels of judges for evaluation of each one  
\- Create, edit, and delete panels/groups of judges (1st round \- overall evaluation and 2nd round \- specific awards)  
\- Add and remove Judges and teams to panels/groups (one panel receives teams that are evaluated for ALL awards)  
\- Add and remove Judges and teams to re-evaluation groups/panels (one re-evaluation group/panel receives teams that will be re-evaluated for specific awards)  
\- View the judges' feedback  
\- View the evaluations (filter by team, by award, and by panel)

The judges can:  
\- Evaluate the teams From the respective panel/group (by award)  
\- Insert, remove, and edit comments by team within the respective group/panel  
\- View evaluations and comments by team for deliberation and re-evaluation (2nd round)  
\- Give feedback (anonymous or not) to the other judges (only the JA will have access)  
\- All users can:  
\- View team schedules (via third-party API \- leave only a "check team schedules" button to be implemented later)  
\- The system can:  
\- Organize evaluations and rank teams in their respective awards  
\- Show discrepancies in the evaluations of each judge in the respective panel/group and suggest adjustments to facilitate deliberation  
\- Suggest order and awards based on evaluations  
\- Display tips for completing the evaluation for each award  
\- The mentor can:  
\- Check evaluation schedules (or return and re-evaluation notices)  
\- Send videos, photos, and engineering notebooks

User Journey:

Judge Advisor (JA \- created by the system's super admin) Log in and go to the home screen with the following options:  
\- Manage users: access system users and can manage Judges  
\- Manage panels/groups: View, add judges and teams (team number and name), create, edit and delete panels (editing and deleting should have an alert and require double confirmation before execution)  
\- Manage Reassessment Groups (2nd round panels): View, add judges and teams (team number and name), create, edit and delete groups (editing and deleting should have an alert and require double confirmation before execution)  
\- Awards: View (a list) and mark if that respective award requires a portfolio  
\- Feedback: View and respond to judges' feedback  
\- Evaluations: View evaluations \- filter by team, by award and by panel  
\- "Check team schedules" or check if there is any impediment (e.g., team did not attend the event or the interview will be online)

Judge (created by the super admin or Judge Advisor) does Log in and you'll be taken to the home screen with the following options:  
\- MY PANEL: the judge is redirected to their respective panel (assigned by the Judge Advisor) where they can:  
\- Filter teams to be evaluated (already entered by the Judge Advisor) and see which ones have already been evaluated and which ones are still pending.  
\- Once the team is selected, the first evaluation of the team is released, along with comments on the respective award to be re-evaluated (whenever the re-evaluation is completed, it is marked with a checkmark indicating this).  
\- "Check team schedules" \- and possible impediments/rearrangements (made by the JA) 

Mentor (creates the account)   
\- My team dashboard: check team interview schedules (scheduled by the judges)   
\- Submit photo/video of the robot and engineering notebook 

Team/students/everyone   
\- Everyone can have access to a landing page with the general dashboard with:   
  \- Redirect button to the matches schedule   
  \- Instructions on how to use the app (guidance for mentors to keep up with updates)   
  \- Important contacts (pit admin, JA, Teams Advisor, police, firefighters, etc.) \- Feedback and support links \- Collaborate\*

INSIGHTS:   
\- Judges post team comments/ratings in the app \-\> AI consumes (vector database?) and provides answers in a chat (for when it's for evaluation in the pits, quick consultations, deliberations, etc.)   
  \- Ex.: Does team X have an engineering notebook? (This should be ticked in the app in the team info)   
\- Script to insert the teams and assign the respective panels

Tables (suggested):   
\- Users: name, email\*, role, room, group   
\- Panel: id\*, name \- Group: id\*, name, award\_name   
\- Teams: id\*, country, panel\_assesment(n), second\_interview\_assessment(n), has\_engineering\_notebook   
\- Panel Assessment: id, team\_country, panel\_id, award   
\- Second Interview Assessment: id, team\_country, panel\_id, award   
\- Award: name, id, criteria, comments 

Stack:   
\- React   
\- TypeScript   
\- Supabase   
\- NextJS   
\- Drizzle (development)   
\- Podman (development \- container PostgreSQL)

Tooling / Architecture   
\- Use BTS/portal architecture (Monorepo app containing all other apps/redirects to the app: FGC Portal   
\- Volunteer/Student/Mentor \-\> Judges, Teams/mentor, Pit admin, Robot Hospital)   
\- Create tooling for SDD/agent   
\- Distribute activities with José (repo, tooling, issue tracker \- Trello?, dev, infra, etc.) align everything and then inner-source   
\- SCM (Trello?, Clickup?) \- notifications via Whatsapp/Slack (check with Carol)   
\- Repository (GitHub \- teams/projects)

Future implementations (backlog)  
\- Judges comments about matches (accessible to all judges)  
\- Timezones  
\- Queueing (page, ping)  
\- Mentors to connect with other mentors via app  
\- Teams access

TO DO  
\- Get Carol's feedback  
\- Get feedback from others  
\- Set repository, SCM and specs  
Provide to AI-SDLC:  
\- product-overview.md  
\- roles-and-permissions.md  
\- business-rules.md  
\- domain-model.md  
\- mvp-feature-specs.md  
\- db-schema.md  
\- system-context.md  
\- roadmap.md  
\- coding-rules.md  
\- architecture-rules.md  
\- Architetural guide (diagrams, specs)  
\- Design System (images, specs)  
\- FGC docs (Judging docs \- awards, criteria, FGC details, colors, design system, etc)  
