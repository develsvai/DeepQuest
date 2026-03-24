"""State models for job description structuring workflow.

This module defines the state management classes used in the job description
structuring graph. It includes input state for initial parameters and
graph state for tracking processing status.
"""

from pydantic import Field

from common.schemas.structured_jd import StructuredJD
from common.state_model import BaseState, BaseStateConfig

jd_example = """
Minimum qualifications:
Bachelor's degree or equivalent practical experience.
5 years of experience with software development in one or more programming languages.
3 years of experience with full stack development, across back-end such as Java, C++, C#, and front-end including JavaScript or TypeScript, HTML, CSS, or equivalent.
1 year of experience with software design and architecture.

Preferred qualifications:
Master's degree or PhD in Computer Science or related technical field.
5 years of experience with data structures/algorithms.
Strong understanding of, or appreciation for, respecting user privacy and protecting S/PII data.
Excellent communication skills, especially across significant timezone differences.
About the job
Google's software engineers develop the next-generation technologies that change how billions of users connect, explore, and interact with information and one another. Our products need to handle information at massive scale, and extend well beyond web search. We're looking for engineers who bring fresh ideas from all areas, including information retrieval, distributed computing, large-scale system design, networking and data storage, security, artificial intelligence, natural language processing, UI design and mobile; the list goes on and is growing every day. As a software engineer, you will work on a specific project critical to Google's needs with opportunities to switch teams and projects as you and our fast-paced business grow and evolve. We need our engineers to be versatile, display leadership qualities and be enthusiastic to take on new problems across the full-stack as we continue to push technology forward.

We build solutions for campus and data center security, pairing with experts in the field to adapt to emergent threats. We partner with digital security teams to form a cohesive barrier against those who would seek to harm Google's users, employees, and IP.

The Core team builds the technical foundation behind Google's flagship products. We are owners and advocates for the underlying design elements, developer platforms, product components, and infrastructure at Google. These are the essential building blocks for excellent, safe, and coherent experiences for our users and drive the pace of innovation for every developer. We look across Google's products to build central solutions, break down technical barriers and strengthen existing systems. As the Core team, we have a mandate and a unique opportunity to impact important technical decisions across the company.

The US base salary range for this full-time position is $166,000-$244,000 + bonus + equity + benefits. Our salary ranges are determined by role, level, and location. Within the range, individual pay is determined by work location and additional factors, including job-related skills, experience, and relevant education or training. Your recruiter can share more about the specific salary range for your preferred location during the hiring process.

Please note that the compensation details listed in US role postings reflect the base salary only, and do not include bonus, equity, or benefits. Learn more about benefits at Google.

Responsibilities
Build, own, and maintain highly scalable distributed systems (e.g., APIs, microservices, DBs).
Prototype, develop, and deploy new technologies that control or monitor access to physical spaces.
Provide timely activation/deactivation mechanisms for spatial access.
Help security teams design, maintain, and analyze the security posture of physical spaces.
Contribute to proactive instrumentation and monitoring of real-time, real-world, cross-digital/physical systems to assess threats, generate alerts, or automatically summon human attention on needs that cannot be solved digitally (e.g., door maintenance, investigating break-ins, etc.).
"""


class InputState(BaseStateConfig):
    """Input state for job description structuring workflow.

    This class defines the initial input parameters required for processing
    a job description, including company name, job title, and the full
    job description text.
    """

    company_name: str = Field(description="The name of the company.", default="Google")
    job_title: str = Field(
        description="The title of the job.",
        default="Senior Software Engineer, Identity and Access, Full Stack",
    )
    job_description: str = Field(
        description="The description of the job.", default=jd_example
    )


class GraphState(InputState, BaseState):
    """Graph state for job description structuring workflow.

    This class extends InputState with additional fields needed during
    the processing workflow, including the structured output data and
    error handling information.
    """

    structured_jd: StructuredJD | None = Field(None, description="The structured JD.")
