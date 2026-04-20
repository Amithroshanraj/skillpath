import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import PageTransition from '@/components/PageTransition';
import { User, GraduationCap, Target, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const InputField = ({ label, value, onChange, placeholder, type = 'text', error }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; error?: string }) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const SelectField = ({ label, value, options, onChange, error }: { label: string; value: string; options: string[]; onChange: (v: string) => void; error?: string }) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const degrees = ['BE', 'BTech', 'BSc', 'BCA', 'MCA', 'MSc', 'MBA', 'Other'];
const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Data Science', 'AI & ML', 'Cyber Security', 'Other'];
const careerGoals = ['Web Developer', 'Python Developer', 'Data Scientist', 'Mobile App Developer', 'Cloud Engineer', 'DevOps Engineer', 'UI/UX Designer', 'Full Stack Developer', 'Other'];
const skills = ['HTML', 'CSS', 'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'Git', 'Machine Learning', 'Docker'];

export default function UserDetails() {
  const navigate = useNavigate();
  const { user, loading, hasCompletedProfile, profile, saveProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '', age: '', educationLevel: '', degree: '', department: '', yearOfStudy: '',
    careerGoal: '', experienceLevel: '', dailyAvailability: '', skillsKnown: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    // Only allow access to users with NO existing progress (true new users)
    // Block returning users or users with any progress data
    if (!loading && user && hasCompletedProfile) {
      navigate('/dashboard');
      return;
    }
  }, [user, loading, navigate, hasCompletedProfile]);

  const update = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const toggleSkill = (s: string) => {
    setForm(f => ({
      ...f,
      skillsKnown: f.skillsKnown.includes(s) ? f.skillsKnown.filter(x => x !== s) : [...f.skillsKnown, s],
    }));
  };

  const validateStep = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.fullName.trim()) errs.fullName = 'Name is required';
      const age = parseInt(form.age);
      if (!form.age || isNaN(age) || age < 10 || age > 100) errs.age = 'Enter valid age (10-100)';
    } else if (step === 1) {
      if (!form.educationLevel) errs.educationLevel = 'Required';
      if (!form.degree) errs.degree = 'Required';
      if (!form.department) errs.department = 'Required';
      if (form.educationLevel === 'College' && !form.yearOfStudy) errs.yearOfStudy = 'Required';
    } else if (step === 2) {
      if (!form.careerGoal) errs.careerGoal = 'Required';
      if (!form.experienceLevel) errs.experienceLevel = 'Required';
      if (!form.dailyAvailability) errs.dailyAvailability = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 2) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const profileData = {
        fullName: form.fullName.trim(),
        age: parseInt(form.age),
        educationLevel: form.educationLevel,
        degree: form.degree,
        department: form.department,
        yearOfStudy: form.yearOfStudy || undefined,
        careerGoal: form.careerGoal,
        experienceLevel: form.experienceLevel,
        dailyAvailability: form.dailyAvailability,
        skillsKnown: form.skillsKnown,
      };

      // Only allow NEW users to save profile
      if (!hasCompletedProfile) {
        await saveProfile(profileData);
        navigate('/assessment-choice');
      } else {
        console.log("Profile updates not allowed for returning users");
        return;
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { icon: User, label: 'Personal' },
    { icon: GraduationCap, label: 'Academic' },
    { icon: Target, label: 'Goals' },
  ];

  if (loading || !user || hasCompletedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-1">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Help us personalize your experience
          </p>

          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  i === step ? 'gradient-primary text-primary-foreground shadow-sm' : i < step ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                }`}>
                  <s.icon className="h-3.5 w-3.5" />{s.label}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-accent' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-5">
                <InputField
                  label="Full Name"
                  value={form.fullName}
                  onChange={v => update('fullName', v)}
                  placeholder="Enter your full name"
                  error={errors.fullName}
                />
                <InputField
                  label="Age"
                  value={form.age}
                  onChange={v => update('age', v)}
                  placeholder="Your age"
                  type="number"
                  error={errors.age}
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-5">
                <SelectField
                  label="Education Level"
                  value={form.educationLevel}
                  options={['College', 'Graduate']}
                  onChange={v => update('educationLevel', v)}
                  error={errors.educationLevel}
                />
                <SelectField
                  label="Degree"
                  value={form.degree}
                  options={degrees}
                  onChange={v => update('degree', v)}
                  error={errors.degree}
                />
                <SelectField
                  label="Department / Stream"
                  value={form.department}
                  options={departments}
                  onChange={v => update('department', v)}
                  error={errors.department}
                />
                {form.educationLevel === 'College' && (
                  <SelectField
                    label="Year of Study"
                    value={form.yearOfStudy}
                    options={['1st Year', '2nd Year', '3rd Year', 'Final Year']}
                    onChange={v => update('yearOfStudy', v)}
                    error={errors.yearOfStudy}
                  />
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-5">
                <SelectField
                  label="Career Goal"
                  value={form.careerGoal}
                  options={careerGoals}
                  onChange={v => update('careerGoal', v)}
                  error={errors.careerGoal}
                />

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Experience Level</label>
                  <div className="flex gap-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => update('experienceLevel', l)}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                          form.experienceLevel === l
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {errors.experienceLevel && <p className="text-xs text-destructive mt-1">{errors.experienceLevel}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Daily Availability</label>
                  <div className="flex gap-2">
                    {['1-2 hrs', '3-4 hrs', '5+ hrs'].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => update('dailyAvailability', h)}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                          form.dailyAvailability === h
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  {errors.dailyAvailability && <p className="text-xs text-destructive mt-1">{errors.dailyAvailability}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Skills Known (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          form.skillsKnown.includes(s)
                            ? 'bg-accent text-accent-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-muted transition-all">
                Back
              </button>
            )}
            <button onClick={handleNext} disabled={submitting} className="flex-1 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {submitting
                ? 'Saving...'
                : 'Complete Profile'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
