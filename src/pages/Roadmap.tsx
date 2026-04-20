import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import PageTransition from '@/components/PageTransition';
import { CheckCircle2, Circle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const card = "bg-card border border-border rounded-xl p-4 shadow-sm";

export default function Roadmap() {
  const { roadmapTopics, toggleTopicComplete, profile, assessmentResult, initialAssessmentResult } = useApp();

  const phases = [...new Set(roadmapTopics.map(t => t.phase))];
  const completedCount = roadmapTopics.filter(t => t.completed).length;
  const progress = roadmapTopics.length > 0 ? Math.round((completedCount / roadmapTopics.length) * 100) : 0;
  const level = assessmentResult?.level || initialAssessmentResult?.level || profile?.experienceLevel || 'Beginner';

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 px-6 pt-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-foreground">Your Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            {profile?.careerGoal} • {level}
          </p>

          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{completedCount} of {roadmapTopics.length} completed</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full rounded-full gradient-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>

          {roadmapTopics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No roadmap generated yet. Complete your profile or take the assessment first.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {phases.map(phase => {
                const phaseTopics = roadmapTopics.filter(t => t.phase === phase);
                const phaseComplete = phaseTopics.every(t => t.completed);
                return (
                  <div key={phase}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`h-3 w-3 rounded-full ${phaseComplete ? 'bg-skill-advanced' : 'bg-muted'}`} />
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">{phase}</h2>
                    </div>
                    <div className="space-y-2.5 ml-1.5 border-l-2 border-border pl-5">
                      {phaseTopics.map((topic, i) => (
                        <motion.div
                          key={topic.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`${card} cursor-pointer transition-all ${topic.completed ? 'opacity-60' : ''}`}
                          onClick={() => toggleTopicComplete(topic.id)}
                        >
                          <div className="flex items-start gap-3">
                            {topic.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-skill-advanced mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <h3 className={`text-sm font-medium ${topic.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {topic.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
                              <div className="flex items-center gap-1 mt-2 text-[10px] text-accent">
                                <Info className="h-3 w-3" />
                                <span>{topic.why}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </PageTransition>
  );
}
