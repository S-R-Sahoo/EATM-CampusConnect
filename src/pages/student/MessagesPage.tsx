import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchConversations, fetchMessages, sendChatMessage, fetchUsers 
} from '../../supabase/db';
import { Conversation, Message, UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Search, Send, Paperclip, Smile, Phone, Video, 
  MoreVertical, CheckCheck, Check, Image as ImageIcon 
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('conv_soumya_priya');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['👍', '❤️', '🔥', '🚀', '🎉', '😊', '🙌', '💯', '👏', '📚'];

  useEffect(() => {
    if (user) {
      fetchConversations(user.id).then(convs => {
        setConversations(convs);
        if (convs.length > 0 && !activeConvId) {
          setActiveConvId(convs[0].id);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId).then(msgs => {
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    }
  }, [activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Get active other party info
  const getOtherParty = () => {
    if (!activeConv || !user) return { name: 'Chat', avatar: undefined, online: false };
    if (activeConv.isGroup) {
      return {
        name: activeConv.groupName || 'Group',
        avatar: activeConv.groupAvatar,
        online: true
      };
    }
    const otherId = activeConv.participants.find(id => id !== user.id) || '';
    const detail = activeConv.participantDetails?.[otherId];
    return {
      name: detail?.name || 'Student',
      avatar: detail?.avatar,
      online: detail?.online ?? true
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConvId || !textInput.trim()) return;

    const textToSend = textInput.trim();
    setTextInput('');
    setShowEmojiPicker(false);

    try {
      const newMsg = await sendChatMessage({
        conversationId: activeConvId,
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        text: textToSend
      });

      setMessages(prev => [...prev, newMsg]);

      // Update last message preview in conversations list
      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lastMessage: {
                text: textToSend,
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
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[550px] bg-white rounded-3xl border border-gray-200/80 shadow-card flex overflow-hidden">
      {/* Left Column: Conversations List */}
      <div className="w-full sm:w-80 md:w-96 border-r border-gray-200/80 flex flex-col bg-white shrink-0">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-gray-900">Messages</h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Campus Chat
            </span>
          </div>

          {/* Chats / Groups Tabs */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'chats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'groups' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Groups
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
            />
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const otherId = conv.participants.find(id => id !== user?.id) || '';
              const details = conv.participantDetails?.[otherId];
              const title = conv.isGroup ? conv.groupName : details?.name || 'User';
              const avatar = conv.isGroup ? conv.groupAvatar : details?.avatar;
              const isActive = conv.id === activeConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-emerald-50/70 border-l-4 border-[#0b4627]' : 'hover:bg-gray-50'
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
                      <h4 className={`text-xs font-bold truncate ${isActive ? 'text-[#0b4627]' : 'text-gray-900'}`}>
                        {title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                        {conv.lastMessage?.timestamp || '12:00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.text || 'Start chatting...'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Chat Window */}
      <div className="flex-1 flex flex-col bg-[#f8faf9]">
        {activeConv ? (
          <>
            {/* Chat Window Header */}
            <div className="p-4 bg-white border-b border-gray-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={other.avatar}
                  name={other.name}
                  size="md"
                  online={other.online}
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{other.name}</h3>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-400">
                <button className="p-2 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition" title="Voice Call">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition" title="Video Call">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
              <div className="text-center my-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  Today
                </span>
              </div>

              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <Avatar
                        src={msg.senderAvatar}
                        name={msg.senderName}
                        size="xs"
                        className="mb-1"
                      />
                    )}

                    <div
                      className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#0b4627] text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-200/70 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex gap-1.5 z-30">
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

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100/90 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] text-xs sm:text-sm rounded-xl px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#111d15] transition"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-2.5 rounded-xl bg-[#0b4627] hover:bg-[#0f5132] text-white disabled:opacity-40 shadow-sm transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
