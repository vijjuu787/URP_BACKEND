## PROJECT OVERVIEW:
URP is a skill-first recruitment platform where:
- Candidates register, build skill profiles, and apply for jobs
- Applying to a job triggers a technical assignment challenge
- Engineers review and score submitted assignments
- Admins manage the entire system, assign engineers, and monitor progress

## register
 -- name
 -- email
 -- password
 -- resume in pdf formate
 

## CORE FEATURES TO SUPPORT:

### 1. USER MANAGEMENT (3 User Types)
- **Candidates**: Apply for jobs, submit assignments, view scores/feedback
- **Engineers**: Review assigned submissions, provide scores and feedback
- **Admins**: Assign engineers, manage jobs, monitor all activity

Requirements:
- User authentication (email/password)
- Role-based access control (candidate, engineer, admin)
- Profile information (name, email, role, avatar, bio)
- Account status (active, inactive, pending)

### 2. CANDIDATE PROFILES
- Personal info (name, email, phone)
- Selected role (Frontend, Backend, Full Stack, DevOps, etc.)
- Skills (multiple skills per candidate, with proficiency levels)
- Experience level (Junior, Mid-Level, Senior, Expert)
- Resume upload (file path/URL)
- Profile completion status
- Total points earned
- Average score across all assignments
- Registration timestamp

### 3. SKILLS SYSTEM
- Skill master list (React, Node.js, Python, Docker, etc.)
- Skill categories (Frontend, Backend, DevOps, Database, etc.)
- Candidate-skill relationships (many-to-many)
- Proficiency levels (Beginner, Intermediate, Advanced, Expert)

### 4. JOB POSTINGS
- Job title (Senior Backend Engineer, etc.)
- Job description
- Role type (Frontend, Backend, Full Stack, etc.)
- Required skills (many-to-many relationship)
- Difficulty level (Easy, Medium, Hard, Expert)
- Points awarded on successful completion
- Status (Open, Closed, Draft)
- Posted date
- Closing date

### 5. ASSIGNMENTS/CHALLENGES
- Assignment title
- Assignment description (markdown/rich text)
- Difficulty level
- Points value
- Associated job (one assignment per job application).   -not using
- Starter files/resources (file paths or URLs)
- Time limit (in hours, e.g., 48 hours)
- Requirements checklist.                              -not unsing
- Evaluation criteria definition

### 6. JOB APPLICATIONS
- Candidate applies to job
- Application timestamp
- Status (Applied, Assignment Sent, Submitted, Under Review, Reviewed, Accepted, Rejected)
- Associated assignment (auto-generated on application)

### 7. ASSIGNMENT SUBMISSIONS
- Candidate who submitted
- Associated job application
- Submission timestamp
- Deadline (calculated from assignment start time + time limit)
- Status (Not Started, In Progress, Submitted, Under Review, Reviewed, Expired)
- Submitted files:
  - File name
  - File type (ZIP, PDF, GitHub link, etc.)
  - File URL/path
  - Upload timestamp
- Submission notes/comments from candidate
- Time taken to complete
- Expiration handling (auto-mark as expired if deadline passed)

### 8. ASSIGNMENT REVIEWS (by Engineers)
- Assignment submission being reviewed
- Engineer who reviewed
- Review timestamp
- Scores (structured):
  - Code Quality (0-100)
  - Logic & Problem Solving (0-100)
  - Best Practices (0-100)
  - Total Score (auto-calculated average)
- Detailed feedback (text)
- Review status (Draft, Submitted)
- Recommendation (Hire, Maybe, Reject)

### 9. ENGINEER ASSIGNMENTS
- Which engineers are assigned to which submissions
- Assignment timestamp
- Assignment status (Pending, In Progress, Completed)
- Admin who made the assignment

### 10. NOTIFICATIONS
- User (recipient)
- Notification type (Submission Received, Review Complete, Assignment Assigned, Deadline Warning, etc.)
- Title
- Message
- Read/unread status
- Timestamp
- Related entity (job, assignment, review, etc.)

### 11. ACTIVITY LOGS / AUDIT TRAIL
- User who performed action
- Action type (User Registered, Job Applied, Assignment Submitted, Review Submitted, Engineer Assigned, etc.)
- Timestamp
- Related entity ID and type
- IP address
- Metadata (JSON field for additional context)

### 12. ANALYTICS/METRICS (Optional but useful)
- Track candidate performance over time
- Engineer review statistics (average score given, review time, etc.)
- Job application metrics (applications per job, acceptance rate, etc.)
- System-wide KPIs

## RELATIONSHIPS TO MODEL:
1. Users ↔ Roles (one-to-many or role field)
2. Candidates ↔ Skills (many-to-many)
3. Jobs ↔ Required Skills (many-to-many)
4. Candidates ↔ Job Applications (one-to-many)
5. Job Applications ↔ Assignments (one-to-one)
6. Assignments ↔ Submissions (one-to-one)
7. Submissions ↔ Reviews (one-to-one)
8. Engineers ↔ Submissions (many-to-many via assignments)
9. Submissions ↔ Files (one-to-many)
10. Users ↔ Notifications (one-to-many)

## ADDITIONAL REQUIREMENTS:
- Use proper foreign keys with CASCADE/SET NULL rules
- Include indexes on frequently queried fields (email, status, timestamps)
- Use ENUM types or lookup tables for status fields
- Include created_at and updated_at timestamps on all tables
- Use UUID or auto-increment integers for primary keys
- Add soft delete support (deleted_at field) where appropriate
- Include constraints (NOT NULL, UNIQUE, CHECK) where necessary
- Design for scalability (normalize properly, avoid redundancy)

## OUTPUT FORMAT:
Provide:
1. **ER Diagram Description** (text-based or Mermaid syntax)
2. **Complete SQL Schema** (CREATE TABLE statements for PostgreSQL)
3. **Table Descriptions** (purpose of each table)
4. **Key Relationships** (foreign keys explained)
5. **Indexes** (recommended indexes for performance)
6. **Sample Queries** (5-10 common queries the app will need)

## EXAMPLE QUERIES TO SUPPORT:
- Get all recommended jobs for a candidate based on their skills
- Get all assignments assigned to a specific engineer
- Get assignment submission with full candidate details and review
- Get candidate's submission history with scores
- Get admin dashboard stats (total users, pending reviews, etc.)
- Get assignments expiring in the next 6 hours
- Get engineer workload (number of pending reviews)
- Get leaderboard (top candidates by average score)
