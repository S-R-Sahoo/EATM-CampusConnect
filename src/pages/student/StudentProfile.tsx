import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Edit3, MapPin, Mail, Phone, Calendar, 
  Award, Briefcase, Code, Sparkles, CheckCircle, 
  ExternalLink, Globe, GraduationCap, Building2, IdCard, ShieldCheck 
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [department, setDepartment] = useState(user?.department || 'CSE');
  const [year, setYear] = useState(user?.year || '3rd Year');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || 'EATM23CSE001');
  const [bio, setBio] = useState(user?.bio || '');
  const [skillsStr, setSkillsStr] = useState(user?.skills?.join(', ') || '');
  const [interestsStr, setInterestsStr] = useState(user?.interests?.join(', ') || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [coverURL, setCoverURL] = useState(user?.coverURL || '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleOpenEdit = () => {
    setDisplayName(user.displayName || '');
    setDepartment(user.department || 'CSE');
    setYear(user.year || '3rd Year');
    setRollNumber(user.rollNumber || 'EATM23CSE001');
    setBio(user.bio || '');
    setSkillsStr(user.skills?.join(', ') || '');
    setInterestsStr(user.interests?.join(', ') || '');
    setPhotoURL(user.photoURL || '');
    setCoverURL(user.coverURL || '');
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({
        displayName,
        department,
        year,
        rollNumber,
        bio,
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        interests: interestsStr.split(',').map(i => i.trim()).filter(Boolean),
        photoURL,
        coverURL
      });
      success('Student profile & academic credentials updated!', 'Changes Saved');
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Cover & Main Identity Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-card overflow-hidden transition-colors duration-150">
        {/* Cover Photo Banner */}
        <div className="h-44 sm:h-56 md:h-64 relative bg-emerald-950 overflow-hidden">
          <img
            src={user.coverURL || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80'}
            alt="Campus Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Top Right Campus Identity Tag on Cover */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">EATM Digital Campus</span>
            <span className="sm:hidden">EATM</span>
          </div>
        </div>

        {/* Profile Content Section (Completely Below Banner - Zero Overlap) */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0">
          {/* Row 1: Floating Avatar & Edit Profile Button */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-20 mb-4 sm:mb-5">
            {/* Avatar with Thick Border */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-white dark:ring-[#111d15] shadow-xl overflow-hidden bg-white dark:bg-[#16251c] flex items-center justify-center">
                <img
                  src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              {user.verified && (
                <div 
                  className="absolute bottom-1 right-1 p-1 sm:p-1.5 rounded-full bg-white dark:bg-[#111d15] shadow-md border border-gray-100 dark:border-[#1e3325]"
                  title="Official Verified Student"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pb-1 sm:pb-2">
              <Button
                variant="crimson"
                size="sm"
                onClick={handleOpenEdit}
                icon={<Edit3 className="w-3.5 h-3.5" />}
                className="shadow-sm font-bold text-xs sm:text-sm"
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Row 2: Student Identity & Academic Details */}
          <div className="space-y-3.5">
            {/* Name and Verified Campus Scholar Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                {user.displayName}
              </h1>
              {user.verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/90 dark:border-emerald-800/70 text-[#0b4627] dark:text-emerald-300 shadow-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950 shrink-0" />
                  <span>Verified Student</span>
                </span>
              )}
            </div>

            {/* Academic Credentials Badges: Branch, Year, Roll No, College */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
              {/* Branch / Department Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs">
                <GraduationCap className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>Branch: <strong className="font-extrabold text-[#0b4627] dark:text-emerald-400">{user.department}</strong></span>
              </div>

              {/* Year & Semester Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs">
                <Calendar className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>Year: <strong className="font-extrabold text-gray-900 dark:text-gray-100">{user.year || '3rd Year'}</strong> {user.semester ? `(${user.semester} Sem)` : ''}</span>
              </div>

              {/* Official Roll Number Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50/90 dark:bg-red-950/40 border border-red-200/90 dark:border-red-900/60 text-xs font-bold text-[#dc2626] dark:text-red-300 shadow-xs">
                <IdCard className="w-4 h-4 text-[#dc2626] dark:text-red-400 shrink-0" />
                <span>Roll No: <strong className="font-black tracking-wide text-[#b91c1c] dark:text-red-300">{user.rollNumber || 'EATM23CSE001'}</strong></span>
              </div>

              {/* College Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 text-xs font-bold text-[#0b4627] dark:text-emerald-300 shadow-xs">
                <Building2 className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>College: <strong className="font-extrabold">Einstein Academy of Technology & Management (EATM)</strong></span>
              </div>
            </div>

            {/* Meta Info: Email, Phone, Location */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>{user.email}</span>
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <span>{user.phone}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>Baniatangi, Bhubaneswar, Odisha</span>
              </span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 mt-6 border-y border-gray-100 dark:border-[#1e3325] text-center bg-gray-50/50 dark:bg-[#16251c]/50 rounded-2xl">
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">{user.stats?.connections || 128}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Connections</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">{user.stats?.posts || 24}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Posts</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">{user.stats?.clubs || 4}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Clubs</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">{user.stats?.achievements || 6}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Achievements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: About, Skills, Interests */}
        <div className="space-y-6">
          {/* About Me */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
              <span>About Me</span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {user.bio || 'Passionate about building innovative engineering solutions and exploring new technologies.'}
            </p>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Skills & Technologies</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400">No skills listed yet.</p>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Interests & Hobbies</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map(int => (
                  <span
                    key={int}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-[#16251c] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-[#1e3325]"
                  >
                    {int}
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400">No interests added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 2-Cols: Projects & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                <span>Featured Projects</span>
              </h3>
            </div>

            <div className="space-y-4">
              {user.projects && user.projects.length > 0 ? (
                user.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-[#1e3325] bg-gray-50/50 dark:bg-[#16251c]/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{proj.title}</h4>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-[#0b4627] dark:hover:text-emerald-400">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {proj.technologies.map(t => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 bg-white dark:bg-[#111d15] rounded border border-gray-200 dark:border-[#1e3325] text-gray-600 dark:text-gray-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No projects added yet.</p>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Campus Honors & Achievements</span>
            </h3>

            <div className="space-y-3">
              {user.achievements && user.achievements.length > 0 ? (
                user.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-[#1e3325] bg-amber-50/30 dark:bg-amber-950/20">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">{ach.title}</h4>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">• {ach.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No achievements recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Student Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              required
            />
            <Input
              label="Roll Number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. EATM23CSE001"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Branch / Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. CSE, ECE, EEE, Mech, Civil"
              required
            />
            <Input
              label="Year of Study"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 3rd Year, 4th Year"
              required
            />
          </div>

          <Input
            label="Profile Photo URL"
            type="url"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            placeholder="https://..."
          />

          <Input
            label="Cover Image URL"
            type="url"
            value={coverURL}
            onChange={(e) => setCoverURL(e.target.value)}
            placeholder="https://..."
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              About Me / Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full p-3 text-xs border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 outline-none resize-none transition"
              placeholder="Tell others about your interests, branch, and goals..."
            />
          </div>

          <Input
            label="Skills (comma separated)"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            placeholder="e.g. C++, Java, Python, React, Web Dev, UI/UX"
          />

          <Input
            label="Interests (comma separated)"
            value={interestsStr}
            onChange={(e) => setInterestsStr(e.target.value)}
            placeholder="e.g. Coding, Gaming, Photography, Travel"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
