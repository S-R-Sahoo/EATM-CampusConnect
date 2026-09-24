import React, { useState } from 'react';
import { Community } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Copy, 
  Check, 
  Share2, 
  Send, 
  ExternalLink, 
  Users, 
  ShieldCheck, 
  Globe, 
  Lock,
  Mail
} from 'lucide-react';

interface CommunityShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
}

export const CommunityShareModal: React.FC<CommunityShareModalProps> = ({
  isOpen,
  onClose,
  community
}) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate shareable URL
  const communityUrl = `${window.location.origin}${window.location.pathname}#/student/communities/${community.id}`;
  const shareText = `Join the "${community.name}" (${community.category} Society) on EATM CampusConnect!\n${community.description?.slice(0, 120) || ''}`;

  // Guaranteed cross-browser copy function with fallback
  const handleCopyLink = async () => {
    let successCopy = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(communityUrl);
        successCopy = true;
      } catch (e) {
        // Fallback below
      }
    }

    if (!successCopy) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = communityUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        successCopy = document.execCommand('copy');
        textArea.remove();
      } catch (err) {
        console.warn('ExecCommand copy fallback failed:', err);
      }
    }

    setCopied(true);
    success(`Link for "${community.name}" copied to clipboard!`, 'Link Copied');

    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${community.name} | EATM CampusConnect`,
          text: shareText,
          url: communityUrl
        });
        onClose();
      } catch (err) {
        // User cancelled or aborted
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + communityUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(communityUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(communityUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(communityUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const subject = `Invitation to join ${community.name} on EATM CampusConnect`;
    const body = `Hi,\n\nI'd like to invite you to check out and join "${community.name}" on EATM CampusConnect.\n\nAbout the society:\n${community.description}\n\nJoin here:\n${communityUrl}\n\nBest regards,\nEATM Campus`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Community / Club" maxWidth="md">
      <div className="space-y-4">
        {/* Community Card Preview */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-[#1e3325] bg-gray-50 dark:bg-[#16251c] shadow-sm">
          <div className="relative h-20 bg-gray-200 dark:bg-[#111d15] overflow-hidden">
            <img
              src={community.coverUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'}
              alt={community.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {community.type === 'private' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 border border-amber-400/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Private</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-300 border border-emerald-400/40">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Public</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-4 pt-0 relative">
            <div className="-mt-6 mb-2 flex items-end justify-between">
              <img
                src={community.logoUrl}
                alt={community.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-[#16251c] shadow-md bg-white"
              />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0b4627] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                {community.category}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{community.name}</h3>
              {community.isOfficial && (
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mb-2">
              {community.description}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold">
              <Users className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400" />
              <span>{community.memberCount} Active Members</span>
            </div>
          </div>
        </div>

        {/* Copy Link Input Section */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Community Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={communityUrl}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] text-gray-700 dark:text-gray-300 focus:outline-none select-all"
            />
            <Button
              size="sm"
              variant={copied ? 'outline' : 'primary'}
              onClick={handleCopyLink}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              className="font-semibold shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Social Share Grid */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Share To
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[#1e3325] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 transition group"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareTelegram}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[#1e3325] hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 transition group"
            >
              <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Telegram</span>
            </button>

            <button
              type="button"
              onClick={handleShareLinkedIn}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[#1e3325] hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 transition group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <ExternalLink className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={handleShareTwitter}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[#1e3325] hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-400 transition group"
            >
              <div className="w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform font-bold text-sm">
                𝕏
              </div>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">X / Twitter</span>
            </button>
          </div>
        </div>

        {/* Other actions (Email & System Native Share) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareEmail}
            icon={<Mail className="w-4 h-4" />}
            className="w-full justify-center font-semibold text-xs"
          >
            Email Invite
          </Button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleNativeShare}
              icon={<Share2 className="w-4 h-4" />}
              className="w-full justify-center font-semibold text-xs"
            >
              System Share
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
