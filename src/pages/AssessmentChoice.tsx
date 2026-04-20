import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { ClipboardCheck, SkipForward } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

export default function AssessmentChoice() {
  const navigate = useNavigate();
  const { saveInitialAssessment, generateRoadmap, roadmapTopics, hasCompletedInitialAssessment } = useApp();

  const handleSkip = async () => {
    // Generate default/minimal assessment results for skip
    await saveInitialAssessment({
      english: 0,
      aptitude: 0,
      technical: 0,
      total: 0,
      level: 'Beginner'
    });
    // only generate if roadmap not already present
    if (roadmapTopics && roadmapTopics.length === 0) {
      await generateRoadmap();
    }
    navigate('/dashboard');
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <ClipboardCheck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Skill Assessment</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Take a quick assessment across English, Aptitude, and Technical skills to get a personalized career roadmap.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/initial-assessment')}
              className="w-full rounded-xl gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" /> {hasCompletedInitialAssessment ? 'Retake Assessment' : 'Take Assessment'}
            </button>
            <button
              onClick={handleSkip}
              className="w-full rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              <SkipForward className="h-4 w-4" /> Skip for Now
            </button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            You can always retake the assessment later from the dashboard.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
