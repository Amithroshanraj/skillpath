import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { initialQuestions } from '@/data/questions';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

export default function InitialAssessment() {
  const navigate = useNavigate();
  const { user, loading, hasCompletedInitialAssessment, saveInitialAssessment, generateRoadmap } = useApp();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [direction, setDirection] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // redirect unauthenticated users back to login
    if (!loading && !user) {
      navigate('/auth');
    }
    // NOTE: we intentionally avoid auto-redirecting users who have already
    // completed the initial assessment so they can retake it if desired.
  }, [user, loading, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) {
      finishAssessment();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (optIdx: number) => {
    setAnswers(prev => ({ ...prev, [initialQuestions[current].id]: optIdx }));
  };

  const goNext = () => {
    if (answers[initialQuestions[current].id] === undefined) return;
    setDirection(1);
    if (current < initialQuestions.length - 1) setCurrent(current + 1);
    else finishAssessment();
  };

  const goBack = () => {
    if (current > 0) { setDirection(-1); setCurrent(current - 1); }
  };

  const finishAssessment = async () => {
    setSubmitting(true);
    const categories: Record<string, { correct: number; total: number }> = {
      english: { correct: 0, total: 0 },
      aptitude: { correct: 0, total: 0 },
      technical: { correct: 0, total: 0 },
    };

    initialQuestions.forEach(question => {
      categories[question.category].total++;
      if (answers[question.id] === question.correct) {
        categories[question.category].correct++;
      }
    });

    const englishPct = Math.round((categories.english.correct / (categories.english.total || 1)) * 100);
    const aptitudePct = Math.round((categories.aptitude.correct / (categories.aptitude.total || 1)) * 100);
    const technicalPct = Math.round((categories.technical.correct / (categories.technical.total || 1)) * 100);
    const totalPct = Math.round((englishPct + aptitudePct + technicalPct) / 3);
    const level = totalPct >= 70 ? 'Advanced' : totalPct >= 40 ? 'Intermediate' : 'Beginner';

    try {
      await saveInitialAssessment({ english: englishPct, aptitude: aptitudePct, technical: technicalPct, total: totalPct, level });
      await generateRoadmap();
      navigate('/dashboard');
    } catch (error) {
      console.error("Error finishing assessment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const q = initialQuestions[current];
  const total = initialQuestions.length;
  const progress = (Object.keys(answers).length / total) * 100;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categoryLabel = q.category === 'english' ? 'Communication' : q.category === 'aptitude' ? 'Aptitude' : 'Technical';
  const categoryColor = q.category === 'english' ? 'bg-chart-english' : q.category === 'aptitude' ? 'bg-chart-aptitude' : 'bg-chart-technical';

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Initial Assessment</h1>
              <p className="text-xs text-muted-foreground mt-1">Quick {total}-question evaluation</p>
            </div>
            <div className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${timeLeft <= 60 ? 'text-destructive border-destructive/30 bg-destructive/5 animate-pulse' : 'text-foreground border-border bg-muted'}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          <div className="mb-6 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full text-primary-foreground ${categoryColor}`}>
                {categoryLabel}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {current + 1} / {total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 40, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-base font-semibold text-foreground mb-6 leading-relaxed">
                {q.question}
              </h2>

              <div className="space-y-2.5">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-200 ${
                      answers[q.id] === idx
                        ? 'border-primary bg-primary/8 text-primary font-medium shadow-sm'
                        : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mr-3 ${
                      answers[q.id] === idx ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex gap-3">
            <button
              onClick={goBack}
              disabled={current === 0 || submitting}
              className="flex items-center gap-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={goNext}
              disabled={answers[q.id] === undefined || submitting}
              className="flex-1 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {submitting ? 'Submitting...' : current === total - 1 ? 'Complete' : 'Next'}
              {current < total - 1 && !submitting && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
