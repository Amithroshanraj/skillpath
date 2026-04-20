import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { mainQuestions, Question } from '@/data/questions';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const sections = [
  { key: 'english' as const, label: 'Communication', color: 'bg-chart-english' },
  { key: 'aptitude' as const, label: 'Aptitude & Reasoning', color: 'bg-chart-aptitude' },
  { key: 'technical' as const, label: 'Technical Skills', color: 'bg-chart-technical' },
];

export default function Assessment() {
  const navigate = useNavigate();
  const { assessmentAnswers, saveAssessmentAnswers, saveAssessmentResult, generateRoadmap, setLastRoute, roadmapTopics } = useApp();
  const [current, setCurrent] = useState(() => {
    try {
      const idx = parseInt(localStorage.getItem('assessmentCurrent') || '', 10);
      return isNaN(idx) ? 0 : idx;
    } catch {
      return 0;
    }
  });
  const [answers, setAnswers] = useState<Record<number, number>>(assessmentAnswers || {});
  const [direction, setDirection] = useState(1);

  const q = mainQuestions[current];
  const total = mainQuestions.length;
  const progress = (Object.keys(answers).length / total) * 100;

  // Section info
  const currentSection = sections.find(s => s.key === q.category)!;
  const sectionQuestions = mainQuestions.filter(mq => mq.category === q.category);
  const sectionIdx = sectionQuestions.indexOf(q) + 1;
  const sectionTotal = sectionQuestions.length;

  useEffect(() => {
    saveAssessmentAnswers(answers);
    try {
      localStorage.setItem('assessmentAnswers', JSON.stringify(answers));
    } catch {}
  }, [answers]);

  const selectAnswer = (optIdx: number) => {
    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));
  };

  const goNext = () => {
    if (answers[q.id] === undefined) return;
    setDirection(1);
    const next = current < total - 1 ? current + 1 : current;
    setCurrent(next);
    try { localStorage.setItem('assessmentCurrent', next.toString()); } catch {}
    if (current < total - 1) {} else finishAssessment();
  };

  const goBack = () => {
    if (current > 0) {
      const prev = current - 1;
      setDirection(-1);
      setCurrent(prev);
      try { localStorage.setItem('assessmentCurrent', prev.toString()); } catch {}
    }
  };

  const finishAssessment = async () => {
    const categories: Record<string, { correct: number; total: number }> = {
      english: { correct: 0, total: 0 },
      aptitude: { correct: 0, total: 0 },
      technical: { correct: 0, total: 0 },
    };

    mainQuestions.forEach(question => {
      categories[question.category].total++;
      if (answers[question.id] === question.correct) {
        categories[question.category].correct++;
      }
    });

    const englishPct = Math.round((categories.english.correct / categories.english.total) * 100);
    const aptitudePct = Math.round((categories.aptitude.correct / categories.aptitude.total) * 100);
    const technicalPct = Math.round((categories.technical.correct / categories.technical.total) * 100);
    const totalPct = Math.round((englishPct + aptitudePct + technicalPct) / 3);
    const level = totalPct >= 70 ? 'Advanced' : totalPct >= 40 ? 'Intermediate' : 'Beginner';

    saveAssessmentResult({ english: englishPct, aptitude: aptitudePct, technical: technicalPct, total: totalPct, level });
    try { localStorage.removeItem('assessmentAnswers'); localStorage.removeItem('assessmentCurrent'); } catch {}
    // only generate if there isn't already a roadmap saved
    if (roadmapTopics && roadmapTopics.length === 0) {
      await generateRoadmap();
    }
    setLastRoute('/results');
    navigate('/results');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="mb-2 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted transition-all">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Detailed Assessment</h1>
              <p className="text-xs text-muted-foreground mt-0.5">90 questions across 3 sections</p>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-2 mt-4 mb-4">
            {sections.map(s => {
              const sQuestions = mainQuestions.filter(mq => mq.category === s.key);
              const answeredInSection = sQuestions.filter(sq => answers[sq.id] !== undefined).length;
              const isActive = q.category === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    const firstOfSection = mainQuestions.findIndex(mq => mq.category === s.key);
                    if (firstOfSection >= 0) { setDirection(firstOfSection > current ? 1 : -1); setCurrent(firstOfSection); }
                  }}
                  className={`flex-1 rounded-xl px-2 py-2 text-center transition-all ${
                    isActive ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50 border border-transparent'
                  }`}
                >
                  <div className={`text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-primary/70' : 'text-muted-foreground/60'}`}>{answeredInSection}/{sQuestions.length}</div>
                </button>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full text-primary-foreground ${currentSection.color}`}>
                {currentSection.label} — {sectionIdx}/{sectionTotal}
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

          {/* Question */}
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

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={goBack}
              disabled={current === 0}
              className="flex items-center gap-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={goNext}
              disabled={answers[q.id] === undefined}
              className="flex-1 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {current === total - 1 ? 'Finish Assessment' : 'Next'}
              {current < total - 1 && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
