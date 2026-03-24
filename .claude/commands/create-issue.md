# GitHub Issue Creator

Create a GitHub issue interactively with predefined template structure.

## Usage

```
/create-issue [brief feature description]
```

## Examples

```
/create-issue user authentication flow
/create-issue dashboard analytics widget
/create-issue mobile responsive design
```

## How it works

This command will start an interactive session to help you create a well-structured GitHub issue with the following template:

- **Title**: Clear, concise feature summary
- **Background**: Context and reason for the feature
- **Description**: Detailed feature specification
- **Technical Approach**: Implementation strategy and considerations
- **Acceptance Criteria**: Checklist of completion requirements
- **Additional Context**: Supporting materials (files, links, references)

The command will guide you through each section, asking targeted questions to ensure comprehensive issue documentation suitable for worktree-based development workflow.

The entire interactive process will be documented and saved as a markdown file in a location specified by the user, allowing you to track the creation process and refine the issue over time.

## Output

Creates a formatted GitHub issue ready to be posted, with proper markdown structure and all necessary details for development planning and tracking.

**Important**: 
- Issues are created at **User Story level** (1-2 weeks of development work)
- Each issue will be assigned to one git worktree for focused development
- If the scope seems too large (Epic level), the command will suggest breaking it into multiple User Stories
- The generated issue will focus on requirements, specifications, and high-level technical approach only. No specific code implementation or detailed technical solutions will be included - these should be determined during the development phase.
- Write it in Korean.