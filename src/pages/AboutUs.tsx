import BottomNav from '@/components/BottomNav';
import PageTransition from '@/components/PageTransition';
import { Target, BarChart3, Map, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/skillpath-logo.png';
import chandruImg from '@/assets/team/chandru.jpeg';
import kesavanImg from '@/assets/team/kesavan.jpeg';
import lokeshImg from '@/assets/team/lokesh.jpeg';
import sivakumarImg from '@/assets/team/sivakumar.jpeg';

const features = [
  { icon: Target, title: 'Skill Assessment', desc: 'Evaluate your strengths across English, Aptitude, and Technical skills.' },
  { icon: BarChart3, title: 'Gap Analysis', desc: 'Identify exactly where you need to improve for your dream career.' },
  { icon: Map, title: 'Custom Roadmap', desc: 'Get a personalized learning path tailored to your goals and level.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'Track your journey with detailed analytics and insights.' },
];

const team = [
  { name: 'Chandru', role: 'Full Stack Developer', img: chandruImg },
  { name: 'Kesavan K', role: 'DevOps & Cloud Engineer', img: kesavanImg },
  { name: 'Lokesh B', role: 'Frontend UI/UX Engineer', img: lokeshImg },
  { name: 'Sivakumar K', role: 'Data Scientist & ML Specialist', img: sivakumarImg },
];

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.4 } });

export default function AboutUs() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 px-6 pt-8">
        <div className="mx-auto max-w-md">
          {/* Hero */}
          <motion.div {...fadeIn(0)} className="text-center mb-8">
            <img src={logo} alt="SkillPath" className="h-16 w-16 rounded-xl mx-auto mb-4 shadow-md" />
            <h1 className="text-2xl font-bold gradient-text">SkillPath</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
              Empowering students to navigate their career journey with personalized assessments and intelligent roadmaps.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div {...fadeIn(1)} className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-2">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We believe every student deserves a clear path to their dream career. SkillPath bridges the gap between where you are and where you want to be — with smart assessments, adaptive learning roadmaps, and continuous progress tracking.
            </p>
          </motion.div>

          {/* Features */}
          <h2 className="font-semibold text-foreground mb-3">Core Features</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((f, i) => (
              <motion.div key={f.title} {...fadeIn(i + 2)} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <f.icon className="h-5 w-5 text-accent mb-2" />
                <h3 className="text-xs font-semibold text-foreground">{f.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Team */}
          <h2 className="font-semibold text-foreground mb-3">Our Team</h2>
          <div className="space-y-3 mb-8">
            {team.map((m, i) => (
              <motion.div key={m.name} {...fadeIn(i + 6)} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <img
                  src={m.img}
                  alt={m.name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-border flex-shrink-0"
                />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          {/* footer removed as per user request */}
        </div>
        <BottomNav />
      </div>
    </PageTransition>
  );
}
