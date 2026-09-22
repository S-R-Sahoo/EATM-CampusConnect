import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchConversations, fetchMessages, sendChatMessage, fetchUsers, 
  subscribeToMessages, getOrCreateConversation, fetchConnections 
} from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';
import { Conversation, Message } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { ChatAudioPlayer } from '../../components/chat/ChatAudioPlayer';
import { MediaLightbox } from '../../components/chat/MediaLightbox';
import { 
  Search, Send, Paperclip, Smile, Phone, Video, 
  MoreVertical, CheckCheck, Image as ImageIcon, MessageSquare,
  ShieldCheck, Users, ArrowLeft, X, Download, FileText,
  Film, Music, Mic, Trash2, Loader2, Sparkles, Camera, Pause
} from 'lucide-react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';

interface StagedAttachment {
  file: File;
  type: 'image' | 'video' | 'file' | 'audio';
  previewUrl: string;
}

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { error, success } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [stagedAttachment, setStagedAttachment] = useState<StagedAttachment | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // WhatsApp style Live Audio Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveHeights, setWaveHeights] = useState<number[]>([
    25, 40, 65, 30, 85, 45, 60, 30, 90, 50, 75, 35, 60, 80, 45, 30, 70, 40, 55, 80, 35, 60, 45, 25
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const isCancelledRef = useRef(false);
  const isPausedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 4 Required Attachment File Pickers: Document, Photos & Video, Camera, Audio
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojis = ['👍', '❤️', '🔥', '🚀', '🎉', '😊', '🙌', '💯', '👏', '📚'];

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const initConvs = async () => {
      try {
        let convs = await fetchConversations(user.id);
        if (!isMounted) return;

        let isFirstTimeConnection = false;
        // If no active conversations, check if there are accepted friends to auto-link
        if (convs.length === 0) {
          try {
            const conns = await fetchConnections(user.id);
            const acceptedConn = conns.find(c => c.status === 'accepted');
            if (acceptedConn) {
              const friendId = acceptedConn.requesterId === user.id ? acceptedConn.recipientId : acceptedConn.requesterId;
              const directConv = await getOrCreateConversation(user.id, friendId);
              convs = [directConv];
              const firstConnKey = `eatm_first_conn_opened_${user.id}`;
              if (!localStorage.getItem(firstConnKey)) {
                isFirstTimeConnection = true;
                localStorage.setItem(firstConnKey, 'true');
              }
            }
          } catch (linkErr) {
            console.warn('Auto-link friend error:', linkErr);
          }
        }

        if (isMounted) setConversations(convs);

        const targetConvId = (location.state as any)?.conversationId || searchParams.get('conversationId');
        const targetUserId = searchParams.get('userId');
        const explicitFirstTime = (location.state as any)?.firstTimeConnection;

        if (targetConvId) {
          setActiveConvId(targetConvId);
        } else if (targetUserId) {
          const conv = await getOrCreateConversation(user.id, targetUserId);
          if (isMounted) {
            setConversations(prev => {
              if (prev.some(c => c.id === conv.id)) return prev;
              return [conv, ...prev];
            });
            setActiveConvId(conv.id);
          }
        } else if ((isFirstTimeConnection || explicitFirstTime) && convs.length > 0) {
          setActiveConvId(convs[0].id);
        }
      } catch (err) {
        console.warn('Failed to initialize conversations:', err);
      }
    };

    initConvs();

    // Background interval to keep conversation list updated with latest messages/connections
    const convsInterval = setInterval(async () => {
      if (!isMounted || !user) return;
      try {
        const fresh = await fetchConversations(user.id);
        if (isMounted && fresh.length > 0) {
          setConversations(fresh);
        }
      } catch (_) {}
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(convsInterval);
    };
  }, [user, location.state, searchParams]);

  useEffect(() => {
    if (activeConvId) {
      let isSubscribed = true;

      fetchMessages(activeConvId).then(msgs => {
        if (!isSubscribed) return;
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });

      // Realtime subscription for incoming chat messages in this conversation
      const unsubscribe = subscribeToMessages(activeConvId, (newMsg) => {
        if (!isSubscribed) return;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      });

      // Live Heartbeat Sync (every 2.5s) to guarantee zero missed messages
      const heartbeatInterval = setInterval(async () => {
        if (!isSubscribed) return;
        try {
          const freshMsgs = await fetchMessages(activeConvId);
          if (!isSubscribed) return;
          setMessages(prev => {
            if (freshMsgs.length === prev.length && freshMsgs[freshMsgs.length - 1]?.id === prev[prev.length - 1]?.id) {
              return prev;
            }
            const map = new Map<string, Message>();
            prev.forEach(m => map.set(m.id, m));
            freshMsgs.forEach(m => map.set(m.id, m));
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
            return merged;
          });
        } catch {
          // ignore background heartbeat errors
        }
      }, 2500);

      return () => {
        isSubscribed = false;
        clearInterval(heartbeatInterval);
        unsubscribe();
      };
    }
  }, [activeConvId]);

  // Clean up any ongoing audio recording when unmounting or switching chats
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
        isCancelledRef.current = true;
        mediaRecorderRef.current.stop();
      }
    };
  }, [activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Get active other party info
  const getOtherParty = () => {
    if (!activeConv || !user) return { name: 'Campus Chat', avatar: undefined, online: false };
    if (activeConv.isGroup) {
      return {
        name: activeConv.groupName || 'Study Group',
        avatar: activeConv.groupAvatar,
        online: true
      };
    }
    const otherId = activeConv.participants.find(id => id !== user.id) || '';
    const detail = activeConv.participantDetails?.[otherId];
    return {
      id: otherId,
      name: detail?.name || 'Student Peer',
      avatar: detail?.avatar,
      online: detail?.online ?? true
    };
  };

  // Handle selecting a file from input
  const handleFilePicked = (type: 'image' | 'video' | 'file' | 'audio') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      error('File size exceeds 25MB limit. Please upload a smaller file.');
      e.target.value = '';
      return;
    }

    // Directly send audio without showing bulky staging box
    if (type === 'audio') {
      setShowAttachmentMenu(false);
      e.target.value = '';
      sendAttachmentDirect(file, 'audio');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setStagedAttachment({ file, type, previewUrl });
    setShowAttachmentMenu(false);
    e.target.value = '';
  };

  // Combined Photos & Video picker handler
  const handlePhotosAndVideosPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      error('File size exceeds 25MB limit. Please upload a smaller file.');
      e.target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    const type: 'image' | 'video' = isVideo ? 'video' : 'image';
    const previewUrl = URL.createObjectURL(file);
    setStagedAttachment({ file, type, previewUrl });
    setShowAttachmentMenu(false);
    e.target.value = '';
  };

  // WhatsApp style Live audio recording handlers (with Pause, Resume, and real-time Waveform)
  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        error('Microphone recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      isCancelledRef.current = false;
      isPausedRef.current = false;
      setIsPaused(false);

      // Web Audio API for real-time waveform visualization
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const updateWave = () => {
            if (analyserRef.current && !isPausedRef.current) {
              const bufferLength = analyserRef.current.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              analyserRef.current.getByteFrequencyData(dataArray);

              const barsCount = 24;
              const newBars: number[] = [];
              for (let i = 0; i < barsCount; i++) {
                const val = dataArray[i % bufferLength];
                // Scale to height percentage (min 15%, max 95%)
                const pct = Math.max(15, Math.min(95, Math.round((val / 255) * 100)));
                newBars.push(pct);
              }
              setWaveHeights(newBars);
            }
            animFrameRef.current = requestAnimationFrame(updateWave);
          };
          animFrameRef.current = requestAnimationFrame(updateWave);
        }
      } catch (e) {
        console.warn('AudioContext visualization fallback:', e);
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
          await sendAttachmentDirect(audioFile, 'audio', recordingSeconds);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access denied:', err);
      error('Microphone permission is required to record voice notes.');
    }
  };

  const pauseVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      isPausedRef.current = true;
      setIsPaused(true);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const resumeVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      isPausedRef.current = false;
      setIsPaused(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    }
  };

  const stopAndSendVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    isCancelledRef.current = false;
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    isCancelledRef.current = true;
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
  };

  // Directly send an audio recording or direct file
  const sendAttachmentDirect = async (file: File, type: 'image' | 'video' | 'file' | 'audio', audioDuration?: number) => {
    if (!user || !activeConvId) return;
    setIsUploading(true);
    try {
      const uploadPath = `chat-media/${activeConvId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploadedUrl = await uploadFile(uploadPath, file);

      const newMsg = await sendChatMessage({
        conversationId: activeConvId,
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        text: '',
        mediaUrl: uploadedUrl,
        mediaType: type,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        audioDuration
      });

      setMessages(prev => [...prev, newMsg]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      error('Failed to send voice note.');
    } finally {
      setIsUploading(false);
    }
  };

  // Main send form submit (text, staged media with caption, or pure media)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConvId) return;

    const trimmed = textInput.trim();
    if (!trimmed && !stagedAttachment) return;

    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    let mediaUrlToSend: string | undefined = undefined;
    let mediaTypeToSend: 'image' | 'video' | 'file' | 'audio' | undefined = undefined;
    let fileNameToSend: string | undefined = undefined;
    let fileSizeToSend: string | undefined = undefined;

    if (stagedAttachment) {
      setIsUploading(true);
      try {
        const uploadPath = `chat-media/${activeConvId}/${Date.now()}_${stagedAttachment.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        mediaUrlToSend = await uploadFile(uploadPath, stagedAttachment.file);
        mediaTypeToSend = stagedAttachment.type;
        fileNameToSend = stagedAttachment.file.name;
        fileSizeToSend = formatFileSize(stagedAttachment.file.size);
      } catch (uploadErr) {
        error('Failed to upload attachment.');
        setIsUploading(false);
        return;
      }
    }

    const textToSend = trimmed;
    setTextInput('');
    setStagedAttachment(null);
    setIsUploading(false);

    try {
      const newMsg = await sendChatMessage({
        conversationId: activeConvId,
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        text: textToSend,
        mediaUrl: mediaUrlToSend,
        mediaType: mediaTypeToSend,
        fileName: fileNameToSend,
        fileSize: fileSizeToSend
      });

      setMessages(prev => [...prev, newMsg]);

      // Update last message preview in conversations list
      let lastText = textToSend;
      if (!lastText) {
        if (mediaTypeToSend === 'image') lastText = '📷 Photo';
        else if (mediaTypeToSend === 'video') lastText = '🎥 Video';
        else if (mediaTypeToSend === 'audio') lastText = '🎤 Voice Note';
        else if (mediaTypeToSend === 'file') lastText = `📄 ${fileNameToSend || 'Document'}`;
        else lastText = 'Attachment';
      }

      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lastMessage: {
                text: lastText,
                senderId: user.id,
                timestamp: 'Just now',
                read: true
              }
            };
          }
          return c;
        })
      );

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      error('Failed to deliver message.');
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'chats' && c.isGroup) return false;
    if (activeTab === 'groups' && !c.isGroup) return false;
    if (searchQuery) {
      const name = c.isGroup ? c.groupName : Object.values(c.participantDetails || {}).map(d => d.name).join(' ');
      return name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const other = getOtherParty();

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-130px)] min-h-[580px] bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-card flex overflow-hidden transition-colors">
      {/* Hidden File Pickers: Document, Photos & Video, Camera, Audio */}
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.csv"
        className="hidden"
        onChange={handleFilePicked('file')}
      />
      <input
        type="file"
        ref={mediaInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={handlePhotosAndVideosPicked}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFilePicked('image')}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        className="hidden"
        onChange={handleFilePicked('audio')}
      />

      {/* Lightbox for Full Size Photo View */}
      {lightboxImage && (
        <MediaLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* Left Column: Official Campus Conversations Directory */}
      <div className={`w-full sm:w-80 md:w-96 border-r border-gray-200/80 dark:border-[#1e3325] flex flex-col bg-white dark:bg-[#111d15] shrink-0 ${activeConvId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-[#1e3325] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={user?.photoURL}
                name={user?.displayName || 'User'}
                size="sm"
              />
              <div>
                <h2 className="font-black text-sm text-gray-900 dark:text-gray-100 leading-tight">Campus Messages</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">EATM Institutional Network</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0b4627] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified
            </span>
          </div>

          {/* Chats / Groups Tabs */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-[#16251c] rounded-xl border border-gray-200/50 dark:border-[#1e3325]">
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'chats' 
                  ? 'bg-white dark:bg-[#111d15] text-[#0b4627] dark:text-emerald-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Direct Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'groups' 
                  ? 'bg-white dark:bg-[#111d15] text-[#0b4627] dark:text-emerald-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Study Groups
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations or peers..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl border border-gray-200 dark:border-[#1e3325] focus:outline-none focus:ring-1 focus:ring-[#0b4627] dark:focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#1e3325]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-[#1e3325]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No conversations yet</p>
              <Link
                to="/student/discover"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0b4627] hover:bg-[#0f5132] text-white text-xs font-semibold shadow-xs transition active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Discover Campus Peers</span>
              </Link>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const otherId = conv.participants.find(id => id !== user?.id) || '';
              const details = conv.participantDetails?.[otherId];
              const title = conv.isGroup ? conv.groupName : details?.name || 'Classmate';
              const avatar = conv.isGroup ? conv.groupAvatar : details?.avatar;
              const isActive = conv.id === activeConvId;
              const isSentByMe = conv.lastMessage?.senderId === user?.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-emerald-50/90 dark:bg-[#16251c] border-l-4 border-[#0b4627] dark:border-emerald-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-[#16251c]/60'
                  }`}
                >
                  <Avatar
                    src={avatar}
                    name={title || 'Chat'}
                    size="md"
                    online={conv.isGroup ? undefined : details?.online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${
                        isActive 
                          ? 'text-[#0b4627] dark:text-emerald-300' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {title}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-1 font-mono">
                        {conv.lastMessage?.timestamp || '12:00'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSentByMe && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conv.lastMessage?.text || 'Start chatting...'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Stream & Media Input */}
      <div className={`flex-1 flex flex-col bg-[#f8faf9] dark:bg-[#0a120d] ${!activeConvId ? 'hidden sm:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Window Header */}
            <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111d15] border-b border-gray-200/80 dark:border-[#1e3325] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveConvId('')}
                  className="sm:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#16251c] rounded-xl transition"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0b4627] dark:text-emerald-400" />
                </button>
                {(!activeConv.isGroup && other.id) ? (
                  <Link
                    to={`/student/profile/${other.id}`}
                    className="flex items-center gap-2.5 sm:gap-3 group/peer hover:opacity-95 transition min-w-0"
                    title="View Student Profile"
                  >
                    <Avatar
                      src={other.avatar}
                      name={other.name}
                      size="md"
                      online={other.online}
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover/peer:text-[#0b4627] dark:group-hover/peer:text-emerald-400 transition-colors truncate">
                        {other.name}
                      </h3>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online • Verified Campus Peer
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <Avatar
                      src={other.avatar}
                      name={other.name}
                      size="md"
                      online={other.online}
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{other.name}</h3>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Official EATM Group
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-400 shrink-0">
                <button 
                  type="button"
                  onClick={() => success('Initiating encrypted campus voice connection...')}
                  className="p-2 hover:text-[#0b4627] dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#16251c] rounded-xl transition" 
                  title="Campus Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => success('Initiating secure campus video link...')}
                  className="p-2 hover:text-[#0b4627] dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#16251c] rounded-xl transition" 
                  title="Campus Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#16251c] rounded-xl transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Stream Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
              {/* Institutional Encrypted Network Badge */}
              <div className="text-center my-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 px-3.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  EATM Encrypted Network • Send photos, videos, notes & voice chat
                </span>
              </div>

              <div className="text-center my-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 bg-white dark:bg-[#111d15] px-3 py-1 rounded-full shadow-xs border border-gray-200/60 dark:border-[#1e3325]">
                  Today
                </span>
              </div>

              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;

                const isAudio = msg.mediaType === 'audio' || 
                  (msg.mediaUrl && (
                    msg.mediaUrl.startsWith('data:audio/') || 
                    msg.mediaUrl.includes('voice-note') || 
                    msg.mediaUrl.includes('audio') ||
                    /\.(mp3|wav|ogg|m4a|aac|opus|weba)(\?.*)?$/i.test(msg.mediaUrl) ||
                    (/\.webm(\?.*)?$/i.test(msg.mediaUrl) && !msg.mediaUrl.includes('video'))
                  ));

                const isImage = !isAudio && (msg.mediaType === 'image' || 
                  (msg.mediaUrl && (
                    msg.mediaUrl.startsWith('data:image/') || 
                    /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(msg.mediaUrl)
                  )));

                const isVideo = !isAudio && !isImage && (msg.mediaType === 'video' || 
                  (msg.mediaUrl && (
                    msg.mediaUrl.startsWith('data:video/') || 
                    /\.(mp4|mov|avi|mkv)(\?.*)?$/i.test(msg.mediaUrl)
                  )));

                const isFile = !isAudio && !isImage && !isVideo && !!msg.mediaUrl;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <Link
                        to={msg.senderId ? `/profile/${msg.senderId}` : '#'}
                        className="mb-1 shrink-0 hover:opacity-90 transition"
                        title="View Profile"
                      >
                        <Avatar
                          src={msg.senderAvatar}
                          name={msg.senderName}
                          size="xs"
                        />
                      </Link>
                    )}

                    {/* Speech Bubble with WhatsApp-like feeling and official EATM branding */}
                    <div
                      className={`${
                        isAudio && !msg.text
                          ? 'px-3 py-1.5 rounded-2xl max-w-fit'
                          : 'max-w-xs sm:max-w-md px-3.5 py-2.5 rounded-2xl leading-relaxed'
                      } shadow-sm text-xs ${
                        isMe
                          ? 'bg-[#0b4627] dark:bg-[#0f5132] text-white rounded-br-xs'
                          : 'bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200/80 dark:border-[#1e3325] rounded-bl-xs'
                      }`}
                    >
                      {/* Sender name for group chats */}
                      {!isMe && activeConv.isGroup && (
                        <p className="text-[11px] font-bold text-[#0b4627] dark:text-emerald-400 mb-1">
                          {msg.senderName}
                        </p>
                      )}

                      {/* 1. Image Media */}
                      {isImage && msg.mediaUrl && (
                        <div className="mb-2">
                          <img
                            src={msg.mediaUrl}
                            alt={msg.fileName || 'Photo'}
                            onClick={() => setLightboxImage({ src: msg.mediaUrl!, alt: msg.fileName || 'Photo' })}
                            className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition shadow-sm"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* 2. Video Media */}
                      {isVideo && msg.mediaUrl && (
                        <div className="mb-2">
                          <video
                            src={msg.mediaUrl}
                            controls
                            playsInline
                            className="rounded-xl max-h-72 w-full bg-black shadow-sm"
                          />
                        </div>
                      )}

                      {/* 3. Audio / Voice Note Media - Only clean inline audio player, NO BIG BOX */}
                      {isAudio && msg.mediaUrl && (
                        <ChatAudioPlayer
                          src={msg.mediaUrl}
                          isMe={isMe}
                          duration={msg.audioDuration}
                        />
                      )}

                      {/* 4. Document / File Media */}
                      {isFile && msg.mediaUrl && (
                        <div className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 border ${
                          isMe
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-gray-50 dark:bg-[#111d15] border-gray-200 dark:border-[#1e3325] text-gray-900 dark:text-gray-100'
                        }`}>
                          <div className={`p-2 rounded-lg ${
                            isMe ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-[#1e3325] text-[#0b4627] dark:text-emerald-400'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{msg.fileName || 'Document'}</p>
                            <p className="text-[10px] opacity-75">{msg.fileSize || 'Attachment'}</p>
                          </div>
                          <a
                            href={msg.mediaUrl}
                            download={msg.fileName || 'document'}
                            className={`p-2 rounded-lg transition active:scale-95 ${
                              isMe
                                ? 'bg-white text-[#0b4627] hover:bg-emerald-50'
                                : 'bg-[#0b4627] hover:bg-[#0f5132] text-white dark:bg-emerald-600'
                            }`}
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Text content */}
                      {msg.text && (
                        <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-normal mt-1">
                          {msg.text}
                        </p>
                      )}

                      {/* Timestamp & Double Checkmarks */}
                      <div className={`flex items-center justify-end gap-1 ${
                        isAudio && !msg.text ? 'mt-0.5' : 'mt-1'
                      } text-[9px] font-mono ${
                        isMe ? 'text-emerald-200' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message & Media Input Bar */}
            <div className="p-3 sm:p-4 bg-white dark:bg-[#111d15] border-t border-gray-200/80 dark:border-[#1e3325] relative">
              {/* Emoji Picker Drawer */}
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-4 bg-white dark:bg-[#111d15] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1e3325] p-2 flex gap-1.5 z-30 animate-in fade-in zoom-in-95">
                  {emojis.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setTextInput(prev => prev + e);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition p-1"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}

              {/* Attachment Popover Menu (WhatsApp style: Document, Photos & Video, Camera, Audio) */}
              {showAttachmentMenu && (
                <div className="absolute bottom-full mb-3 left-12 bg-white dark:bg-[#16251c] rounded-2xl shadow-2xl border border-gray-200/80 dark:border-[#1e3325] p-2 z-30 min-w-[210px] animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-1">
                    {/* 1. Document */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        docInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-[#1f3326] hover:text-[#0b4627] dark:hover:text-emerald-400 rounded-xl transition"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Document</span>
                    </button>

                    {/* 2. Photos & Video */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        mediaInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-[#1f3326] hover:text-[#0b4627] dark:hover:text-emerald-400 rounded-xl transition"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Photos & Video</span>
                    </button>

                    {/* 3. Camera */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        cameraInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-[#1f3326] hover:text-[#0b4627] dark:hover:text-emerald-400 rounded-xl transition"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Camera</span>
                    </button>

                    {/* 4. Audio */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        audioInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-[#1f3326] hover:text-[#0b4627] dark:hover:text-emerald-400 rounded-xl transition"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Music className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Audio</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Staged Attachment Preview Bar */}
              {stagedAttachment && (
                <div className="mb-2 p-2.5 bg-gray-50 dark:bg-[#16251c] rounded-2xl border border-gray-200 dark:border-[#1e3325] flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    {stagedAttachment.type === 'image' && (
                      <img
                        src={stagedAttachment.previewUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-xl border border-gray-200 dark:border-[#1e3325]"
                      />
                    )}
                    {stagedAttachment.type === 'video' && (
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                        <Film className="w-5 h-5" />
                      </div>
                    )}
                    {stagedAttachment.type === 'audio' && (
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                        <Music className="w-5 h-5" />
                      </div>
                    )}
                    {stagedAttachment.type === 'file' && (
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-[#1e3325] text-[#0b4627] dark:text-emerald-400 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-xs">
                        {stagedAttachment.file.name}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {formatFileSize(stagedAttachment.file.size)} • Ready to send
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(stagedAttachment.previewUrl);
                      setStagedAttachment(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Remove Attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Dynamic Input Bar: WhatsApp style Audio Recording (only timing, wave, pause/resume, send) vs Message Dock */}
              {isRecording ? (
                <div className="flex items-center gap-2.5 w-full bg-gray-100/95 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-2xl py-2 px-3 shadow-xs animate-in fade-in duration-150">
                  {/* 1. Delete / Discard (Trash) */}
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition active:scale-90"
                    title="Discard recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* 2. Pause / Resume recording like WhatsApp */}
                  <button
                    type="button"
                    onClick={isPaused ? resumeVoiceRecording : pauseVoiceRecording}
                    className={`p-1.5 rounded-full transition active:scale-90 ${
                      isPaused 
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 ring-2 ring-red-400/50' 
                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                    title={isPaused ? 'Resume recording' : 'Pause recording'}
                  >
                    {isPaused ? <Mic className="w-4 h-4 animate-pulse" /> : <Pause className="w-4 h-4" />}
                  </button>

                  {/* 3. Live Sound Wave Bars during recording (freezes when paused) */}
                  <div className="flex-1 flex items-center justify-center gap-[3px] h-7 px-2 overflow-hidden select-none">
                    {waveHeights.map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`w-[2.5px] rounded-full transition-all duration-75 ${
                          isPaused 
                            ? 'bg-gray-400 dark:bg-gray-600' 
                            : 'bg-[#0b4627] dark:bg-emerald-400 animate-pulse'
                        }`}
                      />
                    ))}
                  </div>

                  {/* 4. Live Timing only */}
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                    <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-ping'}`} />
                    <span>
                      {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* 5. Send button */}
                  <button
                    type="button"
                    onClick={stopAndSendVoiceRecording}
                    className="w-8 h-8 rounded-full bg-[#0b4627] hover:bg-[#0f5132] text-white flex items-center justify-center shrink-0 shadow-xs transition active:scale-95"
                    title="Send Voice Note"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowAttachmentMenu(false);
                    }}
                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-[#16251c] rounded-xl transition"
                    title="Insert Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(!showAttachmentMenu);
                      setShowEmojiPicker(false);
                    }}
                    className={`p-2 rounded-xl transition ${
                      showAttachmentMenu 
                        ? 'text-[#0b4627] dark:text-emerald-400 bg-emerald-50 dark:bg-[#16251c]' 
                        : 'text-gray-400 hover:text-[#0b4627] dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#16251c]'
                    }`}
                    title="Attach Media (Photo, Video, Document, Audio)"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={stagedAttachment ? "Add a caption or note..." : "Type a message or press mic to record..."}
                    className="flex-1 bg-gray-100/90 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] text-xs sm:text-sm rounded-xl px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#111d15] transition"
                  />

                  {/* Dynamic Action: Send button if text/attachment exists, Mic button if empty */}
                  {textInput.trim() || stagedAttachment ? (
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="p-2.5 rounded-xl bg-[#0b4627] hover:bg-[#0f5132] text-white disabled:opacity-40 shadow-sm transition active:scale-95 shrink-0"
                      title="Send Message"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#16251c] hover:bg-emerald-100 dark:hover:bg-[#1f3326] text-[#0b4627] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs transition active:scale-95 shrink-0"
                      title="Record Voice Note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center p-8 text-center bg-gray-50/40 dark:bg-[#0c1610]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-100 dark:border-[#1e3325]">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">
              EATM Campus Messaging
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Select a conversation from the directory to start chatting, exchange lecture notes, share photos, videos, and send voice notes.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-[#0b4627] dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official End-to-End Encrypted Campus Network</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
