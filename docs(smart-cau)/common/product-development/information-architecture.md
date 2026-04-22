# Information Architecture Document
## AI Interview Coaching Service for Early-Career Developers

**Document Version:** 1.1  
**Date:** January 2025  
**Status:** Based on PRD v2.1  
**Product Name:** AI Interview Coach  

---

## PRD Analysis

### Core Objective (Extracted from PRD)
Enable developers to rigorously verify their technical expertise depth through AI-driven questions that specifically test their resume claims against job requirements, using adaptive follow-up questions that probe until knowledge limits are reached across multiple interview preparation workflows.

### Target Audience (Extracted from PRD)
- **Primary:** Early-career software developers (0-5 years experience) managing 3-4 concurrent interviews
- **Geographic:** Korean and English-speaking markets
- **Use Case:** Multi-interview preparation management through systematic technical expertise verification
- **Context:** Developers applying to multiple companies simultaneously with different resumes and technical requirements

### Content & Feature Inventory (MVP + Enhanced Features)
Based on Section 4.1 Core Features (Must Have) and 4.2 Enhanced Features (Should Have):

**Core Features (Must Have):**
1. **Technical Claims Extraction & Analysis Engine** (F1)
2. **Hyper-Personalized Technical Question Generation** (F2) 
3. **Technical Depth Assessment & Feedback** (F3)
4. **Practice Interface** (F4)
5. **Adaptive Deep-Dive Follow-up System** (F5)

**Enhanced Features (Should Have):**
6. **Multi-Interview Preparation Management** (F6)
7. **Technical Depth Benchmarking** (F7)
8. **Technical Depth Analytics** (F8)
9. **Interview Preparation History & Analysis** (F9)

---

## Site Map Structure (Based on PRD MVP + Enhanced Features)

```markdown
- **AI Interview Coach (Home)**
    - **Authentication**
        - Sign Up
        - Sign In
        - OAuth Integration (Google, GitHub)
    - **Multi-Interview Preparation Management**
        - Create New Interview Preparation
            - Resume Upload (PDF/DOCX)
            - Job Description Input (URL/Text)
            - Company Information & Role Title
        - Active Interview Preparations Dashboard
            - [Dynamic: Company Name + Role Context]
            - Progress Overview per Interview Preparation
            - Context Switching between Preparations
        - Interview Preparation History
        - Archived Interview Preparations
    - **Question Practice** (Per Interview Preparation Context)
        - Career Experience Questions
            - [Dynamic: Based on Resume Career Items]
                - Initial Technical Question
                - Follow-up Question Tree (Excluded from Progress)
                    - Depth Level 1 (Surface)
                    - Depth Level 2 (Intermediate)  
                    - Depth Level 3 (Deep)
                    - Depth Level 4 (Expert)
                - Progress Tracking per Career Item (Initial Questions Only)
        - Personal Projects Questions
            - [Dynamic: Based on Resume Project Items]
                - Initial Technical Question
                - Follow-up Question Tree (Excluded from Progress)
                    - Depth Level 1 (Surface)
                    - Depth Level 2 (Intermediate)
                    - Depth Level 3 (Deep)
                    - Depth Level 4 (Expert)
                - Progress Tracking per Project (Initial Questions Only)
        - Common Technical Questions
            - [Dynamic: Based on Job Requirements]
                - Initial Technical Question
                - Follow-up Question Tree (Excluded from Progress)
                    - Depth Level 1 (Surface)
                    - Depth Level 2 (Intermediate)
                    - Depth Level 3 (Deep)
                    - Depth Level 4 (Expert)
                - Progress Tracking per Common Topic (Initial Questions Only)
    - **Feedback & Assessment** (Per Interview Preparation)
        - Immediate Answer Feedback
            - Performance Rating (High/Medium/Low)
            - Strengths Analysis
            - Weaknesses Identification
            - Improvement Suggestions
        - Technical Depth Assessment
            - Depth Level Achieved per Skill
            - Knowledge Gap Identification
            - Resume Claims vs Demonstrated Knowledge
        - Interview Preparation Summary
            - Overall Performance for this Interview Context
            - Technical Topics Covered
            - Depth Achievement by Career/Project/Common Group
    - **User Dashboard**
        - Multi-Interview Preparation Overview
        - Cross-Interview Progress Comparison
        - Global Language Settings (Korean/English UI Toggle)
        - Profile Management
```

---

## User Flows (Based on PRD User Stories)

### 1. User Flow: New User Onboarding (US-1.1, US-1.2)

```markdown
## User Flow: New User Onboarding

1. **Entry Point**: User lands on Home page
2. **Authentication**: User do Sign Up using OAuth (Google, GitHub)
3. **Account Creation**: User completes registration process
4. **Welcome Dashboard**: User lands on Dashboard with "Create New Interview Preparation" CTA
5. **Exit/Next Action**: User proceeds to Interview Preparation Creation flow
```

### 2. User Flow: Interview Preparation Creation (US-1.1, US-1.2)

```markdown
## User Flow: Interview Preparation Creation

1. **Entry Point**: User clicks "Create New Interview Preparation" from Dashboard
2. **Document Upload**: 
   - Resume upload (PDF/DOCX format)
   - System detects document language automatically
3. **Job Description Input**:
   - Option A: Paste job description text
   - Option B: Input job description URL
4. **Company Information**: User provides company details and role title for organization
5. **Processing**: LangGraph workflow analyzes documents and generates questions
6. **Interview Preparation Ready**: User receives confirmation with preparation ID
7. **Exit/Next Action**: User proceeds to Question Practice within this interview preparation context
```

### 3. User Flow: Question Practice by Career/Project/Common Groups (US-2.1, US-2.2)

```markdown
## User Flow: Question Practice

1. **Entry Point**: User enters Question Practice from active interview preparation
2. **Group Selection**: User views Career Experience, Personal Projects, and Common Questions groups
3. **Group Navigation**: 
   - User selects specific career experience OR project OR common technical topic
   - System displays questions specific to that item within current interview preparation context
4. **Question Display**: User sees hyper-personalized technical question
   - Question references specific technologies from selected career/project/common area
   - Question targets job description requirements for this specific interview preparation
5. **Answer Submission**: User provides written answer or audio answer
6. **Immediate Feedback**: System provides instant assessment (US-4.1)
7. **Follow-up Decision**: Based on answer quality (US-4.2)
   - High Quality -> Deeper technical follow-up
   - Medium Quality -> Clarifying follow-up  
   - Low Quality -> Foundational follow-up
8. **Progressive Depth**: System continues follow-ups until knowledge limit reached
   - **Note**: Follow-up questions are excluded from progress tracking due to dynamic nature
9. **Group Completion**: User completes all initial questions for current career/project/common group
10. **Navigation Choice**:
    - Option A: Move to next career experience/project/common group
    - Option B: Review completed groups
    - Option C: Switch to different interview preparation
    - Option D: End current interview preparation practice
11. **Exit/Next Action**: User proceeds to Interview Preparation Review or continues practice
```

### 4. User Flow: Feedback and Follow-up (US-4.1, US-4.2)

```markdown
## User Flow: Feedback and Follow-up

1. **Trigger**: User submits answer to technical question within current interview preparation context
2. **Immediate Analysis**: LangGraph evaluates answer quality (< 5 seconds)
3. **Feedback Display**: System shows structured feedback
   - Performance Rating: High/Medium/Low
   - Strengths: Specific technical points well-addressed
   - Weaknesses: Knowledge gaps identified
   - Improvements: Actionable suggestions
4. **Depth Assessment**: System determines current technical depth level
5. **Follow-up Generation**: AI creates 2-3 follow-up questions based on:
   - Answer quality level
   - Technical depth achieved
   - Knowledge gaps identified
   - Current interview preparation context
6. **Follow-up Presentation**: User sees follow-up questions in tree structure
7. **Depth Progression**: System tracks depth level (Surface -> Intermediate -> Deep -> Expert)
   - **Note**: Follow-up questions are excluded from progress tracking calculations
8. **Completion Criteria**: Follow-ups continue until:
   - Knowledge limit reached
   - User chooses to move to next topic
   - Maximum depth achieved for experience level
9. **Exit/Next Action**: User continues with more questions or moves to next career/project/common group
```

### 5. User Flow: Interview Preparation Review (US-4.3)

```markdown
## User Flow: Interview Preparation Review

1. **Entry Point**: User completes question practice or selects "Review Interview Preparation"
2. **Overview Display**: System shows interview preparation summary
   - Total initial questions practiced (follow-ups excluded from count)
   - Career experience groups covered
   - Personal project groups covered
   - Common questions groups covered
3. **Performance Analysis**: User views detailed assessment for this specific interview preparation
   - Technical depth achieved per career/project/common group
   - Knowledge gaps identified by technical area
   - Resume claims vs demonstrated knowledge comparison
4. **Progress Visualization**: Charts showing depth levels reached within this interview preparation context
5. **Recommendation Display**: System provides improvement suggestions specific to this interview
6. **Interview Preparation Save**: User's preparation data is preserved for future reference
7. **Next Steps**: User can:
   - Switch to different interview preparation
   - Return to incomplete groups within this preparation
   - Create new interview preparation
   - View multi-interview preparation dashboard
8. **Exit/Next Action**: User returns to Dashboard or switches interview preparation context
```

---

## Navigation Structure

### Global Navigation (Available on all pages)
- **Brand/Logo**: Returns to Dashboard
- **User Menu**: Profile, Settings, Sign Out
- **Global Language Toggle**: Korean/English UI toggle (affects static interface elements only)
- **Interview Preparation Status**: Current interview preparation indicator (if active)

### Multi-Interview Preparation Navigation (Dashboard level)
- **Interview Preparation Selector**: Switch between different interview preparation contexts
- **Progress Overview**: Completion status across all active interview preparations
- **Interview Preparation Actions**: Create, Archive, Delete interview preparations

### Interview Preparation-Based Navigation (Within active interview preparation)
- **Interview Preparation Info**: Resume + JD + Company context summary
- **Progress Indicator**: Initial questions completed/remaining by group (follow-ups excluded)
- **Group Navigation**: 
  - Career Experience sections (dynamic based on resume)
  - Personal Projects sections (dynamic based on resume)
  - Common Questions sections (dynamic based on job requirements)
- **Interview Preparation Actions**: Save, Review, Switch Context, End Practice

### Question Navigation (Within career/project/common groups)
- **Group Context**: Current career experience, project, or common topic being practiced
- **Question Tree**: Visual representation of follow-up depth (excluded from progress calculations)
- **Progress Bar**: Initial questions completed within current group (follow-ups excluded)
- **Navigation Controls**: Previous, Next, Skip, Bookmark
- **Depth Indicator**: Current technical depth level being tested
- **Interview Preparation Context**: Clear indication of which interview preparation is active

---

## Content Organization

### Questions Grouped by Resume Career Experience (Per Interview Preparation)
```
* Career Experience Group 1: [Job Title] at [Company]
    * Technologies Used: [Tech Stack from Resume]
    * Initial Questions: Test claimed expertise in specific technologies (Counted in Progress)
    * Follow-up Tree (Excluded from Progress):
        * Surface Level: Basic syntax and concepts
        * Intermediate Level: Implementation and best practices  
        * Deep Level: Architecture decisions and trade-offs
        * Expert Level: Edge cases and advanced optimizations
* Career Experience Group 2: [Job Title] at [Company]
    * Technologies Used: [Tech Stack from Resume]
    * Initial Questions: Test claimed expertise in specific technologies (Counted in Progress)
    * Follow-up Tree: [Same depth structure as above] (Excluded from Progress)
```

### Questions Grouped by Resume Personal Projects (Per Interview Preparation)
```
* Personal Project Group 1: [Project Name]
    * Technologies Used: [Tech Stack from Resume]
    * Project Scope: [Details from Resume]
    * Initial Questions: Test specific technical implementation claims (Counted in Progress)
    * Follow-up Tree (Excluded from Progress):
        * Surface Level: Basic functionality questions
        * Intermediate Level: Design decisions and implementation
        * Deep Level: Scalability and architecture choices
        * Expert Level: Performance optimization and edge cases
* Personal Project Group 2: [Project Name]
    * Technologies Used: [Tech Stack from Resume]
    * Project Scope: [Details from Resume]
    * Initial Questions: Test specific technical implementation claims (Counted in Progress)
    * Follow-up Tree: [Same depth structure as above] (Excluded from Progress)
```

### Questions Grouped by Common Technical Topics (Per Interview Preparation)
```
* Common Technical Group 1: [Job Requirement Area]
    * Technologies Required: [Tech Stack from Job Description]
    * Technical Scope: [Requirements from JD]
    * Initial Questions: Test general technical knowledge required for role (Counted in Progress)
    * Follow-up Tree (Excluded from Progress):
        * Surface Level: Basic concepts and terminology
        * Intermediate Level: Practical application and best practices
        * Deep Level: Advanced implementation and optimization
        * Expert Level: System design and architectural considerations
```

### Interview Preparation Information Structure
```
* Interview Preparation Data
    * Input Documents
        * Resume: [File name, language detected]
        * Job Description: [Source, key requirements extracted]
        * Company Info: [Company name, role title, context details]
    * Analysis Results
        * Technical Claims Extracted: [List by career/project/common area]
        * Job Requirements Mapped: [Alignment with resume]
        * Question Generation Plan: [Coverage by all three categories]
    * Practice Progress (Per Interview Preparation)
        * Career Experience Groups: [Initial questions completion status]
        * Personal Project Groups: [Initial questions completion status]
        * Common Questions Groups: [Initial questions completion status]
        * Overall Depth Achievement: [By technical area within interview context]
        * Follow-up Engagement: [Separate tracking for dynamic questions]
    * Interview Preparation Metadata
        * Creation Date: [Timestamp]
        * Last Activity: [Timestamp]
        * Company Context: [Interview specific details]
        * Status: [Active, Archived, Completed]
```

---

## Information Taxonomy

### Question Category Classification (US-2.1)
- **Career Experience**: Professional work history with employer context
  - Includes: Job titles, companies, employment periods, responsibilities
  - Question Focus: Professional-level expertise, team collaboration, enterprise constraints
  
- **Personal Projects**: Individual technical projects and learning experiences  
  - Includes: Personal repositories, side projects, learning exercises
  - Question Focus: Technical implementation choices, individual problem-solving

- **Common Technical Questions**: General technical knowledge required for role
  - Includes: Industry-standard technical concepts, best practices, foundational knowledge
  - Question Focus: Core technical competencies expected regardless of specific experience

### Question Types Within Each Category Group
1. **Technical Verification Questions**: Test specific technology claims
2. **Implementation Questions**: Probe actual hands-on experience
3. **Design Decision Questions**: Test understanding of architectural choices
4. **Problem-Solving Questions**: Assess ability to handle challenges
5. **Integration Questions**: Test knowledge of how technologies work together

### Follow-up Depth Levels (As defined in PRD Section 5.5)
1. **Surface Level**: Basic syntax and concepts
2. **Intermediate Level**: Implementation and best practices
3. **Deep Level**: Architecture decisions and trade-offs  
4. **Expert Level**: Edge cases and advanced optimizations

### Progress Tracking Policy (US-4.2, US-4.3, F5)
- **Counted in Progress**: Initial questions in Career Experience, Personal Projects, and Common categories
- **Excluded from Progress**: Follow-up questions due to their dynamic, unpredictable nature
- **Alternative Engagement Tracking**: Separate metrics to encourage follow-up question interaction

### Feedback Categorization (As defined in PRD US-4.1)
- **Performance Rating**: High/Medium/Low
- **Strengths**: Specific technical points well-addressed
- **Weaknesses**: Knowledge gaps identified
- **Improvements**: Actionable suggestions with specific learning resources

---

## User Pathways

### From Interview Preparation Creation to Question Practice
```
Interview Preparation Creation -> Document Analysis -> Career/Project/Common Group Selection -> Question Practice
```

### Multi-Interview Preparation Management
```
Dashboard -> Interview Preparation Selection -> Context Switch -> Continue Practice -> Switch to Different Interview Preparation -> Compare Progress
```

### Navigation Between Different Question Category Sets
```
Current Group -> Group Completion -> Navigation Menu -> Next Group Selection (Career/Project/Common) -> Continue Practice
```

### Progress Through Follow-up Question Chains (Excluded from Progress)
```
Initial Question -> Answer Submission -> Quality Assessment -> Follow-up Generation -> Depth Progression -> Repeat until Knowledge Limit
```

### Complete Interview Preparation Flow
```
Dashboard -> Create Interview Preparation -> Upload Documents -> Begin Practice -> Select Career Group -> Practice Questions -> Receive Follow-ups -> Complete Group -> Select Project Group -> Practice Questions -> Receive Follow-ups -> Complete Group -> Select Common Group -> Practice Questions -> Receive Follow-ups -> Complete Group -> Interview Preparation Review -> Dashboard
```

### Cross-Interview Preparation Management Flow
```
Dashboard -> Interview Preparation A -> Practice -> Switch Context -> Interview Preparation B -> Practice -> Switch Context -> Interview Preparation C -> Compare Progress Across All Preparations
```

---

## Assumptions and Missing Information

### Assumptions Made to Complete Structure
1. **Question Ordering Logic**: Assumed systematic ordering of questions within Career Experience, Personal Projects, and Common categories
2. **Cross-Interview Preparation Data Sharing**: Assumed technical insights can be compared across different interview preparation contexts
3. **Interview Preparation Context Persistence**: Assumed seamless context switching between different interview preparations without data loss

### Information Now Explicitly Defined in PRD v2.1
*(Previously assumptions that are now clarified)*
1. **Question Organization**: Now explicitly defined as "Career Experience, Personal Projects, and Common technical questions" (US-2.1)
2. **Multi-Interview Preparation Management**: Now fully detailed as F6 enhanced feature with dashboard, context switching, and separate progress tracking
3. **Progress Tracking Policy**: Now explicitly excludes follow-up questions from progress calculations (US-4.2, US-4.3, F5)
4. **Enhanced Features Scope**: F6-F9 now defined as "Should Have" enhanced features with specific functionality
5. **Language Support**: Simplified to global UI toggle (Korean/English) rather than per-interview-preparation language settings
6. **User Personas**: Updated to explicitly include managing 3-4 concurrent interviews with different technical requirements

### Missing Information from PRD v2.1
1. **Specific UI Layout**: PRD does not specify page layouts or visual arrangement for multi-interview preparation dashboard
2. **Question Quantity per Category**: No specific number of questions per career/project/common group specified for each interview preparation
3. **Interview Preparation Time Limits**: No duration constraints mentioned for MVP practice interviews
4. **Offline Capability**: No mention of offline practice functionality for interview preparations
5. **Question Difficulty Progression**: While depth levels are defined, specific progression criteria within levels not detailed
6. **Follow-up Engagement Incentives**: PRD mentions "alternative engagement incentives" for follow-up questions but doesn't specify implementation details
7. **Interview Preparation Completion Criteria**: What defines when an interview preparation is considered "complete" or ready for the actual interview
8. **Cross-Interview Preparation Analytics**: How performance insights are aggregated and compared across different interview preparations
9. **Context Switch UX Details**: Specific user experience flow for switching between different interview preparation contexts
10. **Common Questions Algorithm**: How the system determines which "Common" technical questions to generate based on job requirements

---

## Standard Information Architecture Patterns Applied

### Navigation Pattern Used: Multi-Hub with Context Switching
- **Primary Hub**: Dashboard serves as central multi-interview preparation management point
- **Secondary Hubs**: Each interview preparation serves as context-specific navigation hub
- **Spokes**: Each career/project/common group is a separate practice area within interview preparation context
- **Linear Sequences**: Follow-up questions within each group follow progressive depth pattern (excluded from progress)

### Content Organization Strategy: Context-Category Hybrid
- **Context-Based**: Separated by interview preparation (different company/role contexts)
- **Category-Based**: Within each interview preparation, organized by Career Experience, Personal Projects, and Common questions
- **Task-Based**: Within each category, organized by progressive technical depth verification

### User Flow Pattern: Multi-Context Sequential with Branching
- **Multi-Context**: Users can manage multiple interview preparation workflows simultaneously
- **Sequential**: Clear progression from interview preparation creation through practice to review within each context
- **Context Switching**: Flexible movement between different interview preparation contexts
- **Branching**: Multiple paths between career/project/common groups, flexible follow-up exploration

---

*This Information Architecture document is based on the MVP and enhanced features defined in PRD v2.1. All structural decisions reflect the explicit requirements for hyper-personalized technical expertise verification through resume-specific question generation organized into Career Experience, Personal Projects, and Common technical questions, adaptive follow-up systems (excluded from progress tracking), and comprehensive multi-interview preparation management capabilities.*
