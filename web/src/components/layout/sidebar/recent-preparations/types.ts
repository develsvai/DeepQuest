/**
 * Type definitions for Recent Preparations sidebar group
 * Used for rendering the collapsible nested navigation structure
 */

export interface SidebarKeyAchievement {
  id: number
  title: string
}

export interface SidebarExperience {
  id: number
  type: 'CAREER' | 'PROJECT'
  name: string // company name (CAREER) or project name (PROJECT)
  questionCount: number
  keyAchievements: SidebarKeyAchievement[]
}

export interface SidebarPreparation {
  id: string
  title: string
  totalQuestions: number
  experiences: SidebarExperience[]
}
