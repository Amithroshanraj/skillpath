import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import PageTransition from '@/components/PageTransition';
import ProgressRing from '@/components/ProgressRing';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

const card = "bg-card border border-border rounded-2xl p-5 shadow-sm";

export default function CareerReady() {
  const { assessmentResult, initialAssessmentResult, isAssessmentCompleted, isInitialAssessmentCompleted, roadmapTopics, profile, getWeeklyActivity } = useApp();

  const completedTopics = roadmapTopics.filter(t => t.completed).length;
  const totalTopics = roadmapTopics.length;
  const roadmapScore = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  const assessmentScore = assessmentResult?.total || initialAssessmentResult?.total || 0;
  const weekly = getWeeklyActivity();
  const consistencyScore = (weekly.activeDays / 7) * 100;

  const readinessScore = Math.round(
    (assessmentScore * 0.3) + (roadmapScore * 0.4) + (consistencyScore * 0.2) + ((isAssessmentCompleted || isInitialAssessmentCompleted) ? 10 : 0)
  );

  const readinessLevel = readinessScore >= 80 ? 'Excellent' : readinessScore >= 60 ? 'Good' : readinessScore >= 40 ? 'Developing' : 'Getting Started';
  const readinessColor = readinessScore >= 80 ? 'text-skill-advanced' : readinessScore >= 60 ? 'text-skill-intermediate' : 'text-skill-beginner';

  const suggestions = [
    { done: isAssessmentCompleted || isInitialAssessmentCompleted, text: 'Complete a skill assessment' },
    { done: roadmapScore >= 50, text: 'Complete at least 50% of your roadmap' },
    { done: weekly.activeDays >= 5, text: 'Study at least 5 days per week' },
    { done: assessmentScore >= 70, text: 'Score 70%+ in assessment' },
    { done: roadmapScore >= 100, text: 'Complete your entire roadmap' },
  ];

  const factors = [
    { label: 'Assessment Score', value: assessmentScore, weight: '30%' },
    { label: 'Roadmap Progress', value: Math.round(roadmapScore), weight: '40%' },
    { label: 'Weekly Consistency', value: Math.round(consistencyScore), weight: '20%' },
    { label: 'Assessment Taken', value: (isAssessmentCompleted || isInitialAssessmentCompleted) ? 100 : 0, weight: '10%' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 px-6 pt-8">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Career Readiness</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{profile?.careerGoal || 'Your career'} readiness score</p>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${card} text-center mb-5`}>
            <ProgressRing progress={readinessScore} size={160} strokeWidth={12} />
            <div className={`text-lg font-bold mt-4 ${readinessColor}`}>{readinessLevel}</div>
            <p className="text-xs text-muted-foreground mt-1">Career Readiness Score</p>
          </motion.div>

          <div className={`${card} mb-4`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground">Score Breakdown</h3>
            </div>
            {/* individual category percentages */}
            <div className="mb-3 text-xs text-muted-foreground">
              <div>English: <span className="font-semibold text-foreground">{assessmentResult?.english ?? initialAssessmentResult?.english ?? 0}%</span></div>
              <div>Aptitude: <span className="font-semibold text-foreground">{assessmentResult?.aptitude ?? initialAssessmentResult?.aptitude ?? 0}%</span></div>
              <div>Technical: <span className="font-semibold text-foreground">{assessmentResult?.technical ?? initialAssessmentResult?.technical ?? 0}%</span></div>
            </div>
            <div className="space-y-3">
              {factors.map(f => (
                <div key={f.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{f.label} <span className="text-[10px]">({f.weight})</span></span>
                    <span className="font-semibold text-foreground">{f.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full gradient-primary" initial={{ width: 0 }} animate={{ width: `${f.value}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground">Improvement Plan</h3>
            </div>
            <div className="space-y-2.5">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {s.done ? <CheckCircle2 className="h-4 w-4 text-skill-advanced flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-skill-intermediate flex-shrink-0" />}
                  <span className={`text-xs ${s.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    </PageTransition>
  );
}
