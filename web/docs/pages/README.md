# Deep Quest Landing Page Screenshots

This directory contains screenshots of the Deep Quest service's main pages in both English and Korean languages, captured for documentation and reference purposes.

## Directory Structure

```
pages/
├── en/                 # English version screenshots
│   ├── dashboard.png
│   ├── interview-prep-new-step1.png
│   ├── interview-prep-new-step2.png
│   ├── interview-prep-detail.png
│   ├── interview-prep-career-experience.png
│   ├── interview-prep-question-answer-feedback.png
│   └── interview-prep-follow-up-questions.png
├── ko/                 # Korean version screenshots
│   ├── dashboard.png
│   ├── interview-prep-new-step1.png
│   ├── interview-prep-new-step2.png
│   ├── interview-prep-detail.png
│   ├── interview-prep-career-experience.png
│   ├── interview-prep-question-answer-feedback.png
│   └── interview-prep-follow-up-questions.png
└── README.md          # This file
```

## Page Descriptions

### 1. Dashboard (`dashboard.png`)

- **URL**: `/[locale]/dashboard`
- **Description**: Main dashboard showing user's interview preparations overview
- **Key Features**:
  - Total preparation statistics
  - Active preparation status
  - Completed questions progress
  - Interview preparation list with status indicators

### 2. New Interview Prep - Step 1 (`interview-prep-new-step1.png`)

- **URL**: `/[locale]/interview-prep/new`
- **Description**: Job posting analysis step
- **Key Features**:
  - Job posting URL input (optional)
  - Company name field
  - Position field
  - Job description text area

### 3. New Interview Prep - Step 2 (`interview-prep-new-step2.png`)

- **URL**: `/[locale]/interview-prep/new?step=2`
- **Description**: Resume upload step
- **Key Features**:
  - Drag & drop file upload area
  - Supported file formats (.pdf, .docx, .txt)
  - AI analysis notification

### 4. Interview Prep Detail (`interview-prep-detail.png`)

- **URL**: `/[locale]/interview-prep/[id]`
- **Description**: Detailed view of a specific interview preparation
- **Key Features**:
  - Job description
  - Candidate profile
  - Practice statistics
  - Experience timeline with all related experiences

### 5. Career Experience Questions (`interview-prep-career-experience.png`)

- **URL**: `/[locale]/interview-prep/[id]/career/[expId]`
- **Description**: List of practice questions for a specific career experience
- **Key Features**:
  - Experience details (company, position, duration)
  - Technology stack
  - Key achievements
  - Categorized questions (Deep, Intermediate, Surface)
  - Follow-up question indicators

### 6. Question Answer & Feedback (`interview-prep-question-answer-feedback.png`)

- **URL**: `/[locale]/interview-prep/[id]/career/[expId]/q[num]`
- **Description**: Question answering interface with AI feedback
- **Key Features**:
  - Question display
  - Answer input area
  - AI feedback with score
  - Strengths, areas for improvement, and suggestions
  - Speaking time indicator

### 7. Follow-up Questions (`interview-prep-follow-up-questions.png`)

- **URL**: `/[locale]/interview-prep/[id]/career/[expId]/q[num]` (after checking follow-up)
- **Description**: AI-generated follow-up questions based on the user's answer
- **Key Features**:
  - Multiple follow-up question options
  - Difficulty level indicators
  - Category tags (Technical, Behavioral)
  - English translations for Korean questions

## Language Support

All pages are available in both:

- **English** (`/en/`) - English interface with English content
- **Korean** (`/ko/`) - Korean interface with Korean content

The service uses `next-intl` for internationalization, allowing seamless language switching.

## Capture Information

- **Capture Date**: August 18, 2025
- **Resolution**: Desktop size (full page capture)
- **Development Server**: http://localhost:3001
- **Tool Used**: Playwright MCP for automated browser capture

## Usage

These screenshots can be used for:

- Documentation and user guides
- Marketing materials
- Design reference
- Feature demonstrations
- Bug reports and issue tracking

## Notes

- All screenshots show the application in a mock-up state with sample data
- User profile shows "John Doe" as a test user
- The interview preparations shown include various companies (Google, Meta, Microsoft, etc.) as examples
- Feedback and scores shown are AI-generated mock responses
