import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, RefreshCw, ArrowRight } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { motion } from 'framer-motion';

export default function Results() {
  const navigate = useNavigate();
  const { assessmentResult, setLastRoute, profile } = useApp();

  if (!assessmentResult) {
    navigate('/assessment-choice');
    return null;
  }

  const { english, aptitude, technical, total, level } = assessmentResult;

  const data = [
    { name: 'English', value: english, color: 'hsl(220, 80%, 55%)' },
    { name: 'Aptitude', value: aptitude, color: 'hsl(38, 90%, 55%)' },
    { name: 'Technical', value: technical, color: 'hsl(172, 55%, 42%)' },
  ];

  const levelColor = level === 'Advanced' ? 'text-skill-advanced' : level === 'Intermediate' ? 'text-skill-intermediate' : 'text-skill-beginner';
  const levelEmoji = level === 'Advanced' ? '🟢' : level === 'Intermediate' ? '🟡' : '🔵';

  const impactMessage = level === 'Advanced'
    ? `Excellent! You're well-prepared for a career as a ${profile?.careerGoal || 'developer'}. Your roadmap will focus on advanced topics.`
    : level === 'Intermediate'
    ? `Good foundation! Your roadmap will strengthen weak areas and build on your strengths for ${profile?.careerGoal || 'your career'}.`
    : `Great start! Your personalized roadmap will build you up from the basics to become a confident ${profile?.careerGoal || 'developer'}.`;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Trophy className="h-8 w-8 text-accent" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Assessment Complete!</h1>
          <p className="text-sm text-muted-foreground mb-6">Here's how you performed</p>

          {/* Pie Chart */}
          <div className="card-elevated rounded-2xl p-6 mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-4 mt-4">
              {data.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}: <span className="font-semibold text-foreground">{d.value}%</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* Score & Level */}
          <div className="card-elevated rounded-2xl p-6 mb-6">
            <div className="text-4xl font-bold gradient-text mb-1">{total}%</div>
            <div className={`text-lg font-semibold ${levelColor}`}>
              {levelEmoji} {level}
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{impactMessage}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => { setLastRoute('/roadmap'); navigate('/roadmap'); }}
              className="w-full rounded-xl gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Generate Roadmap <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/assessment')}
              className="w-full rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retake Assessment
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
