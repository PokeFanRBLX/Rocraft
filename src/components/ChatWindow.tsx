import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Crown,
  Sparkles,
  Shield,
  Trash2,
  Smile,
  Volume2,
  HelpCircle,
  Hash,
  Users
} from 'lucide-react';
import { ChatMessage } from '../types';
import { isOwnerName } from '../utils/ranks';
import { soundEngine } from '../utils/audio';

interface ChatWindowProps {
  playerName: string;
  isOwner: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onExecuteCommand?: (command: string, args: string[]) => void;
  systemNotification?: string | null;
  worldName?: string;
  onOpenOwnerPanel?: () => void;
  onOpenFriendsModal?: () => void;
  whisperTarget?: string | null;
  onClearWhisper?: () => void;
}

// Initial multiplayer messages to give the experience an active server feel
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-sys-1',
    sender: 'Server',
    text: 'Welcome to Rocraft! Press "/" or click the bar below to chat.',
    timestamp: 'Just now',
    isSystem: true,
    badge: 'SYSTEM',
    channel: 'system'
  },
  {
    id: 'msg-player-1',
    sender: 'NoobSlayer99',
    text: 'yo has anyone tried the new DOORS hotel world yet?!',
    timestamp: '1m ago',
    badge: 'VIP',
    channel: 'players'
  },
  {
    id: 'msg-player-2',
    sender: 'BlockyDave',
    text: 'Yeah the library maze is terrifying! Figure dummy is waiting there.',
    timestamp: '45s ago',
    badge: 'MEMBER',
    channel: 'players'
  },
  {
    id: 'msg-player-3',
    sender: 'FarmerBob',
    text: 'Planting watermelons in the Grow a Garden world right now 🌱',
    timestamp: '20s ago',
    badge: 'MEMBER',
    channel: 'players'
  }
];

// Simulated multiplayer chatter pool that occasionally appears
const SIMULATED_CHATTER = [
  { sender: 'PixelBuilder', badge: 'MEMBER', text: 'gg on reaching the windmill!' },
  { sender: 'VoxelQueen', badge: 'VIP', text: 'Low gravity coil + trampoline = insane air time 🚀' },
  { sender: 'SpeedyBlox', badge: 'MEMBER', text: 'The Seek corridor speedpads are so fast!' },
  { sender: 'SkyCrafter', badge: 'MEMBER', text: 'Who wants to build a castle in Sandbox?' },
  { sender: 'DiamondMiner', badge: 'VIP', text: 'Watch out for the killbricks on stage 4!' }
];

const QUICK_ACTIONS = [
  '👋 Hello!',
  'gg!',
  'Look at this!',
  'Follow me!',
  'Awesome build!',
  'OOF!'
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  playerName,
  isOwner,
  isOpen,
  onToggleOpen,
  onExecuteCommand,
  systemNotification,
  worldName,
  onOpenOwnerPanel,
  onOpenFriendsModal,
  whisperTarget,
  onClearWhisper
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // If player connects with owner name, append an announcement
    if (isOwner) {
      return [
        ...INITIAL_MESSAGES,
        {
          id: 'msg-owner-join',
          sender: 'Server',
          text: `👑 ${playerName} joined the server with verified OWNER rank permissions!`,
          timestamp: 'Just now',
          isSystem: true,
          isOwner: true,
          badge: '👑 OWNER',
          channel: 'system'
        }
      ];
    }
    return INITIAL_MESSAGES;
  });

  const [inputValue, setInputValue] = useState('');
  const [activeChannel, setActiveChannel] = useState<'all' | 'players' | 'system'>('all');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickBar, setShowQuickBar] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle whisperTarget focus
  useEffect(() => {
    if (whisperTarget) {
      setInputValue(`/w ${whisperTarget} `);
      if (!isOpen) {
        onToggleOpen();
      }
      setIsMinimized(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      if (onClearWhisper) {
        onClearWhisper();
      }
    }
  }, [whisperTarget, isOpen, onToggleOpen, onClearWhisper]);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Handle external system notifications (checkpoints, preset loads, etc.)
  useEffect(() => {
    if (!systemNotification) return;

    const newSysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'Server',
      text: systemNotification,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
      badge: 'SYSTEM',
      channel: 'system'
    };

    setMessages((prev) => [...prev.slice(-49), newSysMsg]);
    if (!isOpen) {
      setUnreadCount((c) => c + 1);
    }
  }, [systemNotification, isOpen]);

  // Keyboard shortcut ']' to open/close chat (and '/' to open & focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If focused on chat input and user presses ']' with empty input, toggle close!
      if (document.activeElement === inputRef.current) {
        if ((e.key === ']' || e.code === 'BracketRight') && inputValue === '') {
          e.preventDefault();
          inputRef.current?.blur();
          onToggleOpen();
          return;
        }
        return;
      }

      // Don't capture if user is typing in another input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // ']' Key toggles chat open / closed
      if (e.key === ']' || e.code === 'BracketRight') {
        e.preventDefault();
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        onToggleOpen();
        if (!isOpen) {
          setIsMinimized(false);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 60);
        }
        return;
      }

      // '/' Key opens & focuses chat
      if (e.key === '/') {
        e.preventDefault();
        // Exit pointer lock so mouse is freed to click or type
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }

        if (!isOpen) {
          onToggleOpen();
        }
        setIsMinimized(false);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 60);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggleOpen, inputValue]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Occasional simulated multiplayer ambience
  useEffect(() => {
    const interval = setInterval(() => {
      // 30% chance every 25 seconds to add a multiplayer chatter
      if (Math.random() < 0.35) {
        const randomItem = SIMULATED_CHATTER[Math.floor(Math.random() * SIMULATED_CHATTER.length)];
        const newMsg: ChatMessage = {
          id: `sim-${Date.now()}`,
          sender: randomItem.sender,
          text: randomItem.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: randomItem.badge,
          channel: 'players'
        };
        setMessages((prev) => [...prev.slice(-49), newMsg]);
        soundEngine.playChatMessage();
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }
    }, 24000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    soundEngine.playChatSend();

    // Check for client-side commands
    if (trimmed.startsWith('/')) {
      handleChatCommand(trimmed);
      setInputValue('');
      return;
    }

    // Determine sender rank info
    const senderIsOwner = isOwner || isOwnerName(playerName);
    const badge = senderIsOwner ? '👑 OWNER' : 'MEMBER';

    const newMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: playerName || (senderIsOwner ? 'PokeFan_ (Owner)' : 'Player'),
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwner: senderIsOwner,
      badge,
      channel: 'players'
    };

    setMessages((prev) => [...prev.slice(-49), newMsg]);
    setInputValue('');

    // If the OWNER chats, simulated players can react with awe!
    if (senderIsOwner && Math.random() < 0.6) {
      setTimeout(() => {
        const ownerReactions = [
          `👑 ${playerName} is chatting in rainbow text!`,
          `Welcome Owner ${playerName}!`,
          `Check out the Owner Control Panel (#)!`,
          `Awesome to have you here ${playerName}!`
        ];
        const randomReact = ownerReactions[Math.floor(Math.random() * ownerReactions.length)];
        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'BloxFan',
          text: randomReact,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: 'MEMBER',
          channel: 'players'
        };
        setMessages((prev) => [...prev.slice(-49), replyMsg]);
        soundEngine.playChatMessage();
      }, 1200);
    }
  };

  const handleChatCommand = (cmdText: string) => {
    const parts = cmdText.slice(1).split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help': {
        const helpMsg: ChatMessage = {
          id: `cmd-${Date.now()}`,
          sender: 'System Help',
          text: 'Commands: /help, /friends, /w <player> <msg>, /clear, /rank, /oof, /dance, /shout <msg>, /owner',
          timestamp: 'Just now',
          isSystem: true,
          badge: 'SYSTEM',
          channel: 'system'
        };
        setMessages((prev) => [...prev, helpMsg]);
        break;
      }
      case 'friends':
      case 'friend': {
        if (onOpenFriendsModal) {
          onOpenFriendsModal();
        }
        break;
      }
      case 'w':
      case 'whisper':
      case 'msg': {
        if (args.length >= 2) {
          const targetPlayer = args[0];
          const whisperBody = args.slice(1).join(' ');
          const whisperMsg: ChatMessage = {
            id: `w-${Date.now()}`,
            sender: `To ${targetPlayer}`,
            text: `[Whisper]: ${whisperBody}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            badge: 'WHISPER',
            channel: 'players'
          };
          setMessages((prev) => [...prev, whisperMsg]);
          soundEngine.playChatMessage();
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `w-err-${Date.now()}`,
              sender: 'System',
              text: 'Usage: /w <player> <message>',
              timestamp: 'Just now',
              isSystem: true,
              badge: 'SYSTEM',
              channel: 'system'
            }
          ]);
        }
        break;
      }
      case 'clear': {
        setMessages([]);
        break;
      }
      case 'rank': {
        const senderIsOwner = isOwner || isOwnerName(playerName);
        const rankMsg: ChatMessage = {
          id: `cmd-${Date.now()}`,
          sender: 'System',
          text: senderIsOwner
            ? `👑 You hold the verified OWNER Rank! You have access to rainbow-text in chat and the Owner Panel (#).`
            : `You are currently a MEMBER. Set your avatar name to "PokeFan_" to unlock OWNER rank!`,
          timestamp: 'Just now',
          isSystem: true,
          isOwner: senderIsOwner,
          badge: senderIsOwner ? '👑 OWNER' : 'SYSTEM',
          channel: 'system'
        };
        setMessages((prev) => [...prev, rankMsg]);
        break;
      }
      case 'owner': {
        if (onOpenOwnerPanel && (isOwner || isOwnerName(playerName))) {
          onOpenOwnerPanel();
        } else {
          const deniedMsg: ChatMessage = {
            id: `cmd-${Date.now()}`,
            sender: 'System',
            text: '🔒 Owner rank required (Name must start with "PokeFan_").',
            timestamp: 'Just now',
            isSystem: true,
            badge: 'SYSTEM',
            channel: 'system'
          };
          setMessages((prev) => [...prev, deniedMsg]);
        }
        break;
      }
      case 'oof':
      case 'die':
      case 'reset': {
        soundEngine.playOof();
        if (onExecuteCommand) {
          onExecuteCommand('oof', []);
        }
        break;
      }
      case 'dance': {
        soundEngine.playVictory();
        const danceMsg: ChatMessage = {
          id: `cmd-${Date.now()}`,
          sender: playerName,
          text: '*starts dancing happily*',
          timestamp: 'Just now',
          isOwner: isOwner || isOwnerName(playerName),
          badge: isOwner || isOwnerName(playerName) ? '👑 OWNER' : 'MEMBER',
          channel: 'players'
        };
        setMessages((prev) => [...prev, danceMsg]);
        break;
      }
      case 'shout': {
        const text = args.join(' ');
        if (!text) return;
        const senderIsOwner = isOwner || isOwnerName(playerName);
        const shoutMsg: ChatMessage = {
          id: `shout-${Date.now()}`,
          sender: `📢 ${playerName}`,
          text: text.toUpperCase(),
          timestamp: 'Just now',
          isOwner: senderIsOwner,
          badge: senderIsOwner ? '👑 OWNER SHOUT' : 'SHOUT',
          channel: 'all'
        };
        setMessages((prev) => [...prev, shoutMsg]);
        soundEngine.playVictory();
        break;
      }
      default: {
        if (onExecuteCommand) {
          onExecuteCommand(cmd, args);
        } else {
          const unknownMsg: ChatMessage = {
            id: `cmd-${Date.now()}`,
            sender: 'System',
            text: `Unknown command "/${cmd}". Type /help for a list of commands.`,
            timestamp: 'Just now',
            isSystem: true,
            badge: 'SYSTEM',
            channel: 'system'
          };
          setMessages((prev) => [...prev, unknownMsg]);
        }
      }
    }
  };

  const handleQuickAction = (text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  // Filter messages based on active channel
  const filteredMessages = useMemo(() => {
    if (activeChannel === 'all') return messages;
    return messages.filter((m) => m.channel === activeChannel || m.channel === 'all');
  }, [messages, activeChannel]);

  return (
    <div
      id="roblox-chat-container"
      className="pointer-events-auto absolute top-14 left-3 sm:left-4 z-30 flex flex-col font-sans select-text max-w-[calc(100vw-24px)]"
    >
      {/* Minimized or Closed Trigger Button */}
      {!isOpen && (
        <button
          id="chat-toggle-btn"
          onClick={onToggleOpen}
          className="flex items-center gap-2 bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur transition cursor-pointer hover:scale-105 active:scale-95 group"
          title="Open Multiplayer Chat (Press '/')"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black min-w-3.5 text-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold">Chat</span>
          <span className="hidden sm:inline text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded border border-slate-700">
            /
          </span>
        </button>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div
          id="chat-window-panel"
          className={`w-72 sm:w-88 md:w-96 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-700/70 shadow-2xl overflow-hidden transition-all duration-200 flex flex-col ${
            isInputFocused ? 'ring-2 ring-emerald-500/40 bg-slate-950/95' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black tracking-wide text-slate-200 uppercase font-['Fredoka']">
                Multiplayer Chat
              </span>

              {/* Owner Perk Tag */}
              {isOwner && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black rainbow-badge shadow"
                  title="Owner Perks: Rainbow text enabled!"
                >
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span className="rainbow-text">OWNER</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Friends & Lobbies shortcut button */}
              {onOpenFriendsModal && (
                <button
                  onClick={onOpenFriendsModal}
                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded transition cursor-pointer"
                  title="Friends & Multiplayer Lobbies (F)"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}

              {/* Clear chat history */}
              <button
                onClick={() => setMessages([])}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded transition cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Minimize toggle */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition cursor-pointer"
                title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={onToggleOpen}
                className="p-1 text-slate-400 hover:text-white hover:bg-rose-600/80 rounded transition cursor-pointer"
                title="Close Chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Channel Tabs */}
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/60 border-b border-slate-800/60 text-[11px] font-bold">
                <button
                  onClick={() => setActiveChannel('all')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    activeChannel === 'all'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({messages.length})
                </button>
                <button
                  onClick={() => setActiveChannel('players')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    activeChannel === 'players'
                      ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Players
                </button>
                <button
                  onClick={() => setActiveChannel('system')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    activeChannel === 'system'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  System
                </button>

                <div className="ml-auto text-[10px] text-slate-500">
                  Press <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-300">/</kbd> to chat
                </div>
              </div>

              {/* Message Feed Display */}
              <div
                id="chat-messages-scroll"
                className="h-44 sm:h-52 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent text-xs"
              >
                {filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic">
                    <span>No messages yet. Say hello!</span>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const msgIsOwner = msg.isOwner || isOwnerName(msg.sender);

                    return (
                      <div
                        key={msg.id}
                        className={`leading-relaxed break-words rounded-lg px-2 py-1 transition-colors ${
                          msgIsOwner
                            ? 'bg-slate-900/60 border border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                            : msg.isSystem
                            ? 'bg-amber-950/20 border border-amber-600/30 text-amber-200'
                            : 'hover:bg-slate-900/40'
                        }`}
                      >
                        {/* Header line: Badges + Sender + Timestamp */}
                        <span className="inline-flex items-center gap-1 mr-1.5 align-baseline">
                          {/* OWNER Rank Badge */}
                          {msgIsOwner && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black rainbow-badge shadow mr-0.5 align-middle">
                              <Crown className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                              <span className="rainbow-text">OWNER</span>
                            </span>
                          )}

                          {/* Non-Owner Badges */}
                          {!msgIsOwner && msg.badge && (
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                                msg.badge === 'SYSTEM'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : msg.badge === 'VIP'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {msg.badge}
                            </span>
                          )}

                          {/* Sender Name */}
                          <strong
                            className={`font-black tracking-tight ${
                              msgIsOwner
                                ? 'rainbow-text'
                                : msg.isSystem
                                ? 'text-amber-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {msg.sender}:
                          </strong>
                        </span>

                        {/* Message Content: OWNER rank messages proudly receive the rainbow-text style! */}
                        <span
                          className={`inline ${
                            msgIsOwner
                              ? 'rainbow-text font-black tracking-wide drop-shadow text-[12.5px]'
                              : msg.isSystem
                              ? 'text-amber-100 font-medium'
                              : 'text-slate-200'
                          }`}
                        >
                          {msg.text}
                        </span>

                        {/* Time stamp */}
                        <span className="text-[9px] text-slate-500 ml-1.5 inline-block opacity-70">
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Chat Quick Bar */}
              {showQuickBar && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction(action)}
                      className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 whitespace-nowrap cursor-pointer transition"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form Bar */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-1.5 p-2 bg-slate-900/90 border-t border-slate-800/80"
              >
                {/* Quick actions toggle button */}
                <button
                  type="button"
                  onClick={() => setShowQuickBar(!showQuickBar)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    showQuickBar
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Quick reactions"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* Input Field */}
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    id="chat-input-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => {
                      setIsInputFocused(true);
                      if (document.pointerLockElement) {
                        document.exitPointerLock();
                      }
                    }}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder={
                      isOwner
                        ? "Type message (👑 rainbow text! ']' toggles)..."
                        : "Type message (press ']' to open/close)..."
                    }
                    maxLength={140}
                    className={`w-full bg-slate-950/90 text-slate-100 text-xs px-3 py-1.5 rounded-xl border focus:outline-none transition ${
                      isOwner
                        ? 'border-amber-500/50 focus:border-amber-400 placeholder:text-amber-300/40'
                        : 'border-slate-700 focus:border-emerald-500 placeholder:text-slate-500'
                    }`}
                  />

                  {inputValue.length > 100 && (
                    <span className="absolute right-2 top-1.5 text-[9px] text-slate-400">
                      {140 - inputValue.length}
                    </span>
                  )}
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  id="chat-send-btn"
                  disabled={!inputValue.trim()}
                  className={`p-1.5 rounded-xl border transition cursor-pointer ${
                    inputValue.trim()
                      ? isOwner
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                  }`}
                  title="Send Message (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Owner Perk Status Bar Footer */}
              {isOwner && (
                <div className="px-3 py-1 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Crown className="w-3 h-3 text-amber-300" />
                    <span>OWNER Rank Active:</span>
                    <span className="rainbow-text font-black">Rainbow Text Enabled</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenOwnerPanel}
                    className="text-slate-400 hover:text-amber-300 transition cursor-pointer flex items-center gap-0.5"
                  >
                    <Hash className="w-3 h-3" />
                    <span>Panel (#)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
