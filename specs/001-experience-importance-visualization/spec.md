# Feature Specification: Experience Importance Visualization for Interview Preparation

**Feature Branch**: `001-experience-importance-visualization`
**Created**: 2025-10-13
**Status**: Draft
**Input**: User description: "면접 준비 경험 목록 중요도 시각화 기능 - Experience importance visualization for interview preparation"

## Clarifications

### Session 2025-10-13

- Q: How should the system track both AI and user ratings? → A: Store only current rating value, no source tracking or history
- Q: Which AI service generates importance ratings? → A: JD structuring graph first, then resume parser graph generates ratings
- Q: How should the re-sorting transition appear when rating changes? → A: Instant jump to new position, no animation
- Q: How should the retry mechanism work for failed saves? → A: Manual retry only - user must click again
- Q: How should users visually recognize stars are clickable? → A: Cursor change to pointer on hover only

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Importance Indicators (Priority: P1)

A user views their parsed resume experiences on the interview preparation page and immediately sees visual importance indicators (star ratings) next to each experience title, helping them identify which experiences to focus on first.

**Why this priority**: This is the core value proposition - enabling users to quickly identify critical experiences without reading through all details. It's the foundation that makes the entire feature valuable.

**Independent Test**: Can be fully tested by uploading a resume, navigating to the interview prep page, and verifying that star ratings (1-3 stars) appear next to each experience title. Delivers immediate value by showing which experiences are most important.

**Acceptance Scenarios**:

1. **Given** a user has uploaded their resume and it has been AI-parsed into experiences, **When** they view the interview preparation page, **Then** each experience card displays a star rating (⭐, ⭐⭐, or ⭐⭐⭐) near the project/experience title
2. **Given** a user views an experience with high importance, **When** they look at that experience card, **Then** they see three filled stars (⭐⭐⭐) prominently displayed
3. **Given** a user views an experience with medium importance, **When** they look at that experience card, **Then** they see two filled stars (⭐⭐)
4. **Given** a user views an experience with low importance, **When** they look at that experience card, **Then** they see one filled star (⭐)

---

### User Story 2 - Automatic Priority Sorting (Priority: P2)

A user navigates to their interview preparation page and sees their experiences automatically sorted with the most important (3-star) experiences at the top, followed by medium (2-star) and low (1-star) importance experiences, eliminating the need to search for critical content.

**Why this priority**: Automatic sorting enhances the P1 feature by reducing cognitive load - users don't need to scan through all cards to find important ones. However, visual indicators alone (P1) already provide value.

**Independent Test**: Can be tested by verifying the order of experience cards matches importance levels (3-star experiences first, then 2-star, then 1-star). Within each importance level, experiences are sorted by recency. Delivers value by saving users time in finding priority content.

**Acceptance Scenarios**:

1. **Given** a user has experiences with mixed importance levels, **When** they view the interview preparation page, **Then** all 3-star experiences appear before any 2-star experiences, and all 2-star experiences appear before any 1-star experiences
2. **Given** multiple experiences have the same importance level, **When** they are displayed in the sorted list, **Then** within each importance tier, experiences are ordered by date (most recent first)
3. **Given** a user refreshes or re-enters the interview preparation page, **When** the page loads, **Then** the sorting order remains consistent with importance-first, then recency

---

### User Story 3 - Enhanced Visual Emphasis (Priority: P3)

A user scans their interview preparation page and can immediately distinguish high-importance experiences from lower-priority ones through enhanced visual styling (borders, backgrounds, shadows), allowing for instant prioritization without reading details.

**Why this priority**: Visual differentiation complements P1 (star indicators) and P2 (sorting) by making important experiences stand out even more. However, star ratings and sorting already provide sufficient prioritization cues.

**Independent Test**: Can be tested by comparing the visual styling (border weight, background color, shadow) of high-importance versus low-importance experience cards. Delivers value by making the page more scannable and reducing decision-making effort.

**Acceptance Scenarios**:

1. **Given** a user views an experience with high importance (3 stars), **When** they see the experience card, **Then** it displays a more prominent border, a subtle background color highlight, and a visible shadow effect compared to lower-priority cards
2. **Given** a user views an experience with low importance (1 star), **When** they see the experience card, **Then** it displays standard styling with a basic border, default background, and minimal shadow
3. **Given** a user views the full list of experiences, **When** they scroll through the page, **Then** they can immediately identify high-importance cards through visual hierarchy without needing to read star ratings

---

### User Story 4 - Edit Importance Ratings (Priority: P4)

A user can manually adjust the importance rating of any experience by clicking on the star rating component, immediately overriding the AI's initial assessment to match their own judgment about interview relevance.

**Why this priority**: While AI ratings provide a helpful starting point (P1-P3), users know their target roles and interview contexts best. Manual editing allows personalization without disrupting the core read-only viewing experience. This is P4 because the feature is valuable even without editing capability.

**Independent Test**: Can be fully tested by clicking on a star rating, selecting a different importance level (1-3 stars), and verifying the change persists immediately without page refresh. Also verify that the experience re-sorts according to the new rating. Delivers value by empowering users to customize their preparation focus.

**Acceptance Scenarios**:

1. **Given** a user hovers over any star rating component, **When** the cursor moves over the stars, **Then** all stars up to and including the hovered star are highlighted (unfilled stars become filled, similar to movie rating sites)
2. **Given** a user clicks on a star (1st, 2nd, or 3rd position), **When** the click is registered, **Then** the importance rating updates immediately to match the clicked position (1 star, 2 stars, or 3 stars respectively)
3. **Given** a user changes an experience's rating from 2 stars to 3 stars, **When** the rating is saved, **Then** the experience card immediately updates its visual styling to high-importance (enhanced border, background, shadow) without page refresh
4. **Given** a user changes an experience's rating, **When** the new rating is applied, **Then** the experience list automatically re-sorts to reflect the new importance order (e.g., upgraded experience moves up, downgraded moves down)
5. **Given** a user changes a rating and then refreshes the page, **When** the page reloads, **Then** the user's custom rating persists (not the original AI rating)
6. **Given** a user clicks on the currently selected rating (e.g., clicks the 2nd star when 2 stars are already selected), **When** the click is registered, **Then** the rating remains at 2 stars (no toggle-off behavior, minimum 1 star always maintained)

---

### Edge Cases

- What happens when all experiences have the same importance level (e.g., all 3-star)? → All experiences are displayed with consistent styling and sorted by recency only
- What happens when an experience has no importance rating assigned (null/undefined from AI parsing)? → Default to medium importance (2 stars) and include a fallback mechanism in the UI
- What happens if the AI parsing fails to assign importance for some experiences? → Display those experiences with a default 2-star rating and log the issue for monitoring
- How does the system handle experiences with identical titles and dates within the same importance tier? → Maintain stable sort order using a secondary identifier (e.g., database ID or creation timestamp)
- What happens when a user has a very large number of experiences (50+)? → The sorting and visual hierarchy should help focus attention on top priorities; consider pagination or "show more" functionality (out of scope for MVP)
- What happens if a user's rating change request fails (network error, server error)? → Display an error message and revert the star rating to the previous value; user must manually retry by clicking the star again (no automatic retry)
- What happens if multiple users edit the same experience simultaneously (if applicable)? → Last write wins; the most recent change overwrites previous changes (standard for single-user data)
- What happens when a user rapidly clicks multiple stars in quick succession? → Debounce the save operation to only persist the final selected rating, preventing duplicate save requests
- What happens if a user is on a slow network connection when editing ratings? → Show a loading indicator on the star component while saving; disable further clicks until the save completes

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a visual importance indicator (star rating: ⭐, ⭐⭐, or ⭐⭐⭐) next to each experience title on the interview preparation page
- **FR-002**: System MUST retrieve importance ratings from the AI-parsed resume data generated by the resume parser graph (which receives JD structuring graph output as context) with importance levels: high, medium, low
- **FR-003**: System MUST map importance levels to star ratings: high → 3 stars (⭐⭐⭐), medium → 2 stars (⭐⭐), low → 1 star (⭐)
- **FR-004**: System MUST automatically sort experiences by importance level in descending order (high importance first, then medium, then low)
- **FR-005**: System MUST apply secondary sorting by recency (most recent first) within each importance tier when experiences share the same importance level
- **FR-006**: System MUST apply enhanced visual styling to high-importance experiences: stronger border, subtle background color, visible shadow
- **FR-007**: System MUST apply standard visual styling to medium and low-importance experiences: basic border, default background, minimal shadow
- **FR-008**: System MUST handle missing or null importance ratings by defaulting to medium importance (2 stars)
- **FR-009**: System MUST maintain consistent sorting order across page refreshes and navigation
- **FR-010**: System MUST ensure star rating indicators are immediately visible without user interaction (no hover states or clicks required)
- **FR-011**: System MUST make star ratings interactive and clickable for editing
- **FR-012**: System MUST provide hover feedback on star ratings - when user hovers over a star position, all stars up to and including that position MUST visually highlight (preview the potential selection)
- **FR-013**: System MUST update the importance rating immediately when a user clicks on a star (1st star = 1 star rating, 2nd star = 2 stars, 3rd star = 3 stars)
- **FR-014**: System MUST persist user-edited ratings to the database immediately upon selection (auto-save, no explicit save button required)
- **FR-015**: System MUST preserve user-edited ratings across page refreshes and sessions (user edits override AI ratings permanently unless reset)
- **FR-016**: System MUST automatically re-sort the experience list when a rating is changed to maintain importance-first ordering (instant repositioning without animation)
- **FR-017**: System MUST update the visual styling of an experience card immediately when its rating changes (e.g., from 2 stars to 3 stars triggers high-importance styling)
- **FR-018**: System MUST handle save failures gracefully - display an error message and revert to the previous rating value if the save operation fails (manual retry only, user must click star again to retry)
- **FR-019**: System MUST debounce rapid successive clicks on stars to prevent duplicate save requests (minimum 300ms between saves)
- **FR-020**: System MUST show a loading/saving indicator on the star component while a rating change is being persisted
- **FR-021**: System MUST disable further star clicks on a specific experience while a previous rating change for that experience is still being saved
- **FR-022**: System MUST show pointer cursor when hovering over star ratings to indicate interactivity (no additional visual affordances required at rest state)

### Key Entities

- **Experience**: Represents a work experience, project, or achievement from the user's resume
  - Attributes: title, description, date/duration, importance rating (high/medium/low stored as single current value), other resume-parsed data
  - Relationships: Belongs to a user's parsed resume data
  - Data Model Note: Only the current rating value is stored; no source tracking (AI vs user) or edit history is maintained

- **Importance Rating**: Represents the current significance level of an experience for interview preparation
  - Attributes: level (high/medium/low) stored as single value
  - Relationships: Associated with one Experience entity (stored as attribute on Experience)
  - Behavior: Initially set by resume parser graph (which receives JD structuring context); user edits directly overwrite the value with no history tracking

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the most important experience within 3 seconds of viewing the interview preparation page (measurable through eye-tracking or user studies)
- **SC-002**: 90% of users correctly identify high-importance experiences without reading full descriptions (measurable through task completion testing)
- **SC-003**: Average time to locate a high-importance experience is reduced by 50% compared to unsorted/unstyled experience lists (measurable through A/B testing or time-to-task completion metrics)
- **SC-004**: Visual hierarchy is immediately apparent - users can distinguish between importance levels at a glance without confusion (measurable through user testing and feedback)
- **SC-005**: The page renders and displays sorted experiences with visual indicators within 2 seconds of loading (measurable through performance monitoring)
- **SC-006**: Zero errors occur when handling experiences with missing or null importance ratings (measurable through error logs and monitoring)
- **SC-007**: Users can successfully change a star rating with a single click, and the change persists immediately without page refresh (measurable through user testing - 95% task completion rate)
- **SC-008**: Rating changes are saved to the database within 1 second of user interaction (measurable through performance monitoring)
- **SC-009**: Star rating hover feedback responds within 100ms of cursor movement (measurable through performance testing)
- **SC-010**: 90% of users understand that star ratings are clickable and editable without explicit instructions (measurable through usability testing - "discoverability" metric)
- **SC-011**: Zero data loss occurs during rating edits - all user changes are successfully persisted (measurable through data integrity audits and error logs)
- **SC-012**: Save failures are handled gracefully with user-visible error messages in 100% of failure cases (measurable through error handling tests and monitoring)
