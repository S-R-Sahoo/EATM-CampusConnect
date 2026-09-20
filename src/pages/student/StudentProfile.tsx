import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Edit3, MapPin, Mail, Phone, Calendar, 
  Award, Briefcase, Code, Sparkles, CheckCircle, ExternalLink, Globe 
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'projects' | 'achievements'>('about');

  // Edit form state
  const [bio, setBio] = useState(user?.bio || '');
  const [skillsStr, setSkillsStr] = useState(user?.skills?.join(', ') || '');
  const [interestsStr, setInterestsStr] = useState(user?.interests?.join(', ') || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [coverURL, setCoverURL] = useState(user?.coverURL || '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({
        bio,
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        interests: interestsStr.split(',').map(i => i.trim()).filter(Boolean),
        photoURL,
        coverURL
      });
      success('Profile updated successfully!', 'Changes Saved');
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Cover & Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-card overflow-hidden">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 relative bg-emerald-950 overflow-hidden">
          <img
            src={user.coverURL || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80'}
            alt="Campus Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Profile Info Area */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <Avatar
                src={user.photoURL}
                name={user.displayName}
                size="xl"
                className="ring-4 ring-white"
              />
              <div className="pt-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                    {user.displayName}
                  </h1>
                  {user.verified && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-50 shrink-0" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-0.5">
                  {user.department} • {user.year || 'Student'} • EATM
                </p>
                {user.rollNumber && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Roll No: <span className="font-semibold text-gray-600">{user.rollNumber}</span>
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="crimson"
              size="sm"
              onClick={() => {
                setBio(user.bio || '');
                setSkillsStr(user.skills?.join(', ') || '');
                setInterestsStr(user.interests?.join(', ') || '');
                setPhotoURL(user.photoURL || '');
                setCoverURL(user.coverURL || '');
                setEditModalOpen(true);
              }}
              icon={<Edit3 className="w-3.5 h-3.5" />}
              className="self-center sm:self-end shadow-sm"
            >
              Edit Profile
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-gray-100 text-center">
            <div>
              <div className="text-xl font-black text-gray-900">{user.stats?.connections || 128}</div>
              <div className="text-xs font-semibold text-gray-500">Connections</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">{user.stats?.posts || 24}</div>
              <div className="text-xs font-semibold text-gray-500">Posts</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">{user.stats?.clubs || 4}</div>
              <div className="text-xs font-semibold text-gray-500">Clubs</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">{user.stats?.achievements || 6}</div>
              <div className="text-xs font-semibold text-gray-500">Achievements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: About, Skills, Interests */}
        <div className="space-y-6">
          {/* About Me */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">About Me</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {user.bio || 'Passionate about building innovative engineering solutions and exploring new technologies.'}
            </p>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#0b4627] border border-emerald-200/60"
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
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map(int => (
                  <span
                    key={int}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700"
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
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-[#0b4627]" />
                <span>Featured Projects</span>
              </h3>
            </div>

            <div className="space-y-4">
              {user.projects && user.projects.length > 0 ? (
                user.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-emerald-200 transition">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-sm text-gray-900">{proj.title}</h4>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#0b4627]">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {proj.technologies.map(t => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-600">
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
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Campus Honors & Achievements</span>
            </h3>

            <div className="space-y-3">
              {user.achievements && user.achievements.length > 0 ? (
                user.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 bg-amber-50/30">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-gray-900">{ach.title}</h4>
                        <span className="text-[10px] text-gray-400">• {ach.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{ach.description}</p>
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
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              About Me / Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
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
