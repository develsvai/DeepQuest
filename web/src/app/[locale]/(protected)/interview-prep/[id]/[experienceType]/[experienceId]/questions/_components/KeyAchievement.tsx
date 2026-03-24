import { Target, Zap, Trophy, Lightbulb, MessageSquare } from 'lucide-react'
import {
  ActionCard,
  ActionCardHeader,
  ActionCardContent,
  ActionCardFooter,
} from '@/components/ui/custom/action-card'
import { StarSection } from '../../_components/StarSection'
import type { KeyAchievementDetailResult } from '@/server/services/key-achievement'

/**
 * Props for KeyAchievement component
 */
interface KeyAchievementProps {
  achievement: KeyAchievementDetailResult
}

/**
 * Key Achievement Component
 *
 * Displays a single key achievement with STAR format in a 2x2 grid layout.
 * This is a read-only view with only progress bar in the footer.
 */
export default function KeyAchievement({ achievement }: KeyAchievementProps) {
  const hasQuestions = achievement.totalQuestions > 0

  return (
    <ActionCard className={!hasQuestions ? 'pb-6' : undefined}>
      <ActionCardHeader title={achievement.title} />

      <ActionCardContent>
        {/* Responsive: vertical on mobile, 2x2 grid on md+ */}
        <div className='flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-6'>
          <StarSection
            icon={Target}
            label='Situation & Task'
            items={achievement.problems}
          />
          <StarSection icon={Zap} label='Action' items={achievement.actions} />
          <StarSection
            icon={Trophy}
            label='Result'
            items={achievement.results}
            variant='highlight'
          />
          <StarSection
            icon={Lightbulb}
            label='Reflection'
            items={achievement.reflections}
            variant='italic'
          />
        </div>
      </ActionCardContent>

      {hasQuestions && (
        <ActionCardFooter
          progress={{
            label: 'Questions',
            icon: <MessageSquare size={13} />,
            completed: achievement.completedQuestions,
            total: achievement.totalQuestions,
          }}
        />
      )}
    </ActionCard>
  )
}
