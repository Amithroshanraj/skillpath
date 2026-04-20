import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ProgressRing from '@/components/ProgressRing';
import PageTransition from '@/components/PageTransition';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LogOut, Map, RefreshCw, User, HelpCircle, Sparkles, Calendar, Target, ChevronRight, Star, Award } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const card = "bg-card border border-border rounded-2xl p-5 shadow-sm";
const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07, duration: 0.4 } });

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user, loading, profile, hasCompletedProfile, hasCompletedInitialAssessment,
    initialAssessmentResult, roadmapTopics, logout, practiceScores, getWeeklyActivity,
  } = useApp();

  // Remove all blocking logic - just render dashboard if user exists

  if (loading || !user || !hasCompletedProfile || !hasCompletedInitialAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedTopics = roadmapTopics.filter(t => t.completed).length;
  const totalTopics = roadmapTopics.length;
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const currentTopic = roadmapTopics.find(t => !t.completed);

  const weekly = getWeeklyActivity();
  const levelEmoji = initialAssessmentResult?.level === 'Advanced' ? '🟢' : initialAssessmentResult?.level === 'Intermediate' ? '🟡' : '🔵';

  const buildPieData = (result: { english: number; aptitude: number; technical: number }) => [
    { name: 'English', value: result.english, color: 'hsl(220, 80%, 55%)' },
    { name: 'Aptitude', value: result.aptitude, color: 'hsl(38, 90%, 55%)' },
    { name: 'Technical', value: result.technical, color: 'hsl(172, 55%, 42%)' },
  ];

  const motivationMessages = [
    "Every expert was once a beginner. Keep going! 💪",
    "Consistency beats intensity. Show up daily! 🔥",
    "Your future self will thank you for today's effort! 🌟",
    "Small steps lead to big breakthroughs! 🚀",
  ];
  const todayMotivation = motivationMessages[new Date().getDay() % motivationMessages.length];

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const SkillBar = ({ label, value }: { label: string; value: number }) => {
    const color = value >= 70 ? 'bg-skill-advanced' : value >= 40 ? 'bg-skill-intermediate' : 'bg-skill-beginner';
    return (
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold text-foreground">{value}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
      </div>
    );
  };

  const MiniPieChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => (
    <div className="flex items-center gap-4">
      <PieChart width={90} height={90}>
        <Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={40} paddingAngle={3} dataKey="value">
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
      </PieChart>
      <div className="space-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.name}:</span>
            <span className="font-semibold">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="gradient-primary px-6 pt-8 pb-14 rounded-b-[2rem]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-foreground/70 text-sm">Welcome back 👋</p>
              <h1 className="text-xl font-bold text-primary-foreground mt-0.5">{profile?.fullName}</h1>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[11px] text-primary-foreground/90 bg-primary-foreground/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Target className="h-3 w-3" />{profile?.careerGoal}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-primary-foreground/70">
                <span>⭐ Self: {profile?.experienceLevel}</span>
                {initialAssessmentResult && <span>{levelEmoji} Evaluated: {initialAssessmentResult.level}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20" />
              <button onClick={handleLogout} className="rounded-xl bg-primary-foreground/10 p-2.5 text-primary-foreground hover:bg-primary-foreground/20 transition-all">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-8 space-y-4">
          <motion.div {...fadeIn(0)} className={card}>
            <div className="flex items-center gap-6">
              <ProgressRing progress={overallProgress} size={100} strokeWidth={8} label={`${completedTopics}/${totalTopics}`} sublabel="topics" />
              <div>
                <h3 className="font-semibold text-foreground">Overall Progress</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallProgress === 100 ? 'Amazing! All topics completed! 🎉' : `${totalTopics - completedTopics} topics remaining`}
                </p>
              </div>
            </div>
          </motion.div>

          {initialAssessmentResult && (
            <motion.div {...fadeIn(1)} className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Assessment Result</h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">Skill Score</span>
              </div>
              <MiniPieChart data={buildPieData(initialAssessmentResult)} />
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overall: <span className="font-semibold text-foreground">{initialAssessmentResult.total}%</span></span>
                <span className="text-xs font-medium text-accent">{initialAssessmentResult.level}</span>
              </div>
            </motion.div>
          )}

          <motion.div {...fadeIn(3)} className={card}>
            <h3 className="font-semibold text-foreground mb-4">Skill Breakdown</h3>
            <div className="space-y-3.5">
              <SkillBar label="Communication" value={practiceScores.english} />
              <SkillBar label="Aptitude & Reasoning" value={practiceScores.aptitude} />
              <SkillBar label="Technical Skills" value={practiceScores.technical} />
            </div>
          </motion.div>

          {overallProgress === 100 && (
            <motion.div {...fadeIn(4)} className="rounded-2xl p-5 gradient-primary text-primary-foreground shadow-lg">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8" />
                <div>
                  <h3 className="font-bold">Congratulations! 🎉</h3>
                  <p className="text-xs opacity-80">You've completed your entire roadmap!</p>
                </div>
              </div>
              <button onClick={() => navigate('/career-ready')} className="mt-3 w-full rounded-xl bg-primary-foreground/20 py-2.5 text-xs font-semibold hover:bg-primary-foreground/30 transition-all">
                View Career Readiness →
              </button>
            </motion.div>
          )}

          {currentTopic && (
            <motion.div {...fadeIn(5)} className={card}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground">Today's Focus</h3>
              </div>
              <h4 className="text-sm font-medium text-foreground">{currentTopic.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{currentTopic.description}</p>
              <button
                onClick={() => navigate('/roadmap')}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Go to Roadmap <ChevronRight className="h-3 w-3" />
              </button>
            </motion.div>
          )}

          <motion.div {...fadeIn(6)} className={card}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground">Weekly Activity</h3>
            </div>
            <div className="flex items-end gap-2 justify-between">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 rounded-lg transition-all ${weekly.days[i] ? 'bg-accent h-8' : 'bg-muted h-4'}`} />
                  <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span><span className="font-semibold text-foreground">{weekly.topicsThisWeek}</span> topics done</span>
              <span><span className="font-semibold text-foreground">{weekly.activeDays}</span> active days</span>
            </div>
          </motion.div>

          <motion.div {...fadeIn(7)} className={card}>
            <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Map, label: 'View Roadmap', path: '/roadmap' },
                { icon: RefreshCw, label: 'Retake Assessment', path: '/assessment-choice' },
                { icon: HelpCircle, label: 'About Us', path: '/about' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-3 text-xs font-medium text-foreground hover:bg-muted/50 transition-all">
                  <a.icon className="h-4 w-4 text-muted-foreground" /> {a.label}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeIn(8)} className="rounded-2xl bg-accent/8 border border-accent/15 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground text-sm">Daily Insight</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{todayMotivation}</p>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  );
}
