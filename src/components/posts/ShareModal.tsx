import React, { useState } from 'react';
import { Post } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { incrementPostShare, getPostShareUrl } from '../../supabase/db';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { 
  Copy, 
  Check, 
  Share2, 
  Send, 
  ExternalLink 
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onShared?: (newCount: number) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  post,
  onShared
}) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate shareable URL
  const postUrl = getPostShareUrl(post.id);

  const shareText = `Check out this post by ${post.authorName} on EATM CampusConnect: "${post.content.slice(0, 80)}${post.content.length > 80 ? '...' : ''}"`;

  // Guaranteed cross-browser copy function with fallback
  const handleCopyLink = async () => {
    let successCopy = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(postUrl);
        successCopy = true;
      } catch (e) {
        // Fallback below
      }
    }

    if (!successCopy) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
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
    success('Post link copied to clipboard!', 'Link Copied');
    recordShare();

    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const recordShare = async () => {
    try {
      const newCount = await incrementPostShare(post.id);
      onShared?.(newCount);
    } catch (e) {
      console.warn('Failed to increment share count', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName} | EATM CampusConnect`,
          text: shareText,
          url: postUrl
        });
        recordShare();
        onClose();
      } catch (err) {
        // User cancelled or aborted
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + postUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    recordShare();
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    recordShare();
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    recordShare();
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    recordShare();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Post" maxWidth="md">
      <div className="space-y-4">
        {/* Post Preview Box */}
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-100 dark:border-[#1e3325]">
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-gray-100">{post.authorName}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{post.authorDept || 'EATM Campus'}</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
            {post.content || (post.mediaUrl ? '[Photo Attachment]' : '[Campus Post]')}
          </p>
        </div>

        {/* Copy Link Input Section */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Post Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={postUrl}
              className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-[#0b4627] select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0b4627] hover:bg-[#08351d] text-white dark:bg-emerald-700 dark:hover:bg-emerald-600'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Destinations Grid */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Share to
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200/80 dark:border-[#1e3325] hover:border-emerald-500/60 dark:hover:border-emerald-600 bg-white dark:bg-[#16251c] hover:bg-emerald-50/50 dark:hover:bg-[#182e21] transition group"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4 rotate-[-20deg]" />
              </div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={handleShareTwitter}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200/80 dark:border-[#1e3325] hover:border-sky-500/60 dark:hover:border-sky-600 bg-white dark:bg-[#16251c] hover:bg-sky-50/50 dark:hover:bg-[#142630] transition group"
            >
              <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <ExternalLink className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">X (Twitter)</span>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={handleShareLinkedIn}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200/80 dark:border-[#1e3325] hover:border-blue-500/60 dark:hover:border-blue-600 bg-white dark:bg-[#16251c] hover:bg-blue-50/50 dark:hover:bg-[#152332] transition group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">LinkedIn</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={handleShareTelegram}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200/80 dark:border-[#1e3325] hover:border-cyan-500/60 dark:hover:border-cyan-600 bg-white dark:bg-[#16251c] hover:bg-cyan-50/50 dark:hover:bg-[#132831] transition group"
            >
              <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Telegram</span>
            </button>
          </div>
        </div>

        {/* Native Web Share API button if supported */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-[#1e3325] hover:bg-gray-50 dark:hover:bg-[#182b20] text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <span>More Options / System Share</span>
          </button>
        )}
      </div>
    </Modal>
  );
};
