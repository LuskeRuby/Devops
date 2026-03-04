---
name: User Story
about: Define a vertically sliced feature with clear acceptance criteria and priority
title: "[Epic Name]: Short Action Description"
labels: ''
assignees: ''

---

**Epic:** [Link to parent Epic issue, e.g., #12, or type Epic name]

### 📖 User Story
**As a** [type of user], 
**I want to** [specific action], 
**So that** [benefit/reason].

---

### ✅ Acceptance Criteria (Definition of Done)
*Define the Use Cases using Gherkin syntax.*

**The Happy Path (Main Success Scenario)**
- [ ] **Given** [context/precondition], **When** [user action], **Then** [expected successful outcome].

**Exception/Alternative Paths (Edge Cases)**
- [ ] **Given** [context/precondition], **When** [invalid action or error state], **Then** [graceful error handling or message].

---

### 🛠️ Technical Notes & Vertical Slicing
*List the full-stack requirements to ensure this issue is independent.*
* **Frontend:** [UI components needed, e.g., Login Form component]
* **Backend:** [API endpoints required, e.g., `POST /api/login`]
* **Database:** [Tables or models affected, e.g., `Users` table]
* **Mocking/Dependencies:** [If the API isn't ready, what fake data will the frontend use to keep working?]

---

### 🛡️ Non-Functional Requirements (Optional)
* [e.g., Security: Passwords must be hashed using bcrypt]
* [e.g., Performance: Page must load in under 2 seconds]
