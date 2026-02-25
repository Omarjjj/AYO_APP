import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { 
  Send, 
  Mic, 
  MicOff,
  Sparkles, 
  User,
  Brain,
  Layers
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store/useStore'
import { cn, formatTime } from '../lib/utils'

interface MessageBubbleProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    metadata?: {
      usedAI?: boolean
      contextUsed?: boolean
      processingTime?: number
    }
  }
  index: number
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bubbleRef.current) {
      gsap.fromTo(bubbleRef.current, 
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)', delay: index * 0.05 }
      )
    }
  }, [index])

  return (
    <motion.div
      ref={bubbleRef}
      className={cn(
        "flex gap-3 max-w-[80%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
        isUser 
          ? "bg-ayo-purple/20 border border-ayo-purple/30" 
          : "bg-ayo-border/50 border border-ayo-border"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />
        ) : (
          <Sparkles className="w-4 h-4 text-ayo-silver" strokeWidth={1.5} />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-4 py-3 rounded-2xl",
          isUser 
            ? "bg-ayo-purple/20 border border-ayo-purple/30 text-ayo-white rounded-tr-sm" 
            : "glass-card text-ayo-silver rounded-tl-sm"
        )}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Metadata */}
        <div className={cn(
          "flex items-center gap-2 mt-1.5 px-1",
          isUser ? "flex-row-reverse" : ""
        )}>
          <span className="text-[10px] text-ayo-muted">
            {formatTime(message.timestamp)}
          </span>
          
          {!isUser && message.metadata && (
            <div className="flex items-center gap-1">
              {message.metadata.usedAI && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-ayo-purple/10 text-ayo-purple">
                  <Brain className="w-2.5 h-2.5" />
                  <span className="text-[9px] uppercase">ai</span>
                </div>
              )}
              {message.metadata.contextUsed && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-ayo-warning/10 text-ayo-warning">
                  <Layers className="w-2.5 h-2.5" />
                  <span className="text-[9px] uppercase">ctx</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 max-w-[80%] mr-auto"
    >
      <div className="w-8 h-8 rounded-xl bg-ayo-border/50 border border-ayo-border flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-ayo-silver" strokeWidth={1.5} />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm glass-card">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-ayo-purple typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-ayo-purple typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-ayo-purple typing-dot" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Chat() {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { messages, addMessage, setAssistantStatus, contextCaptureEnabled, privacyMode } = useStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    addMessage({ role: 'user', content: input.trim() })
    setInput('')
    
    setIsTyping(true)
    setAssistantStatus('processing')
    
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
    
    setIsTyping(false)
    setAssistantStatus('responding')
    
    const responses = [
      "I understand. Let me help you with that.",
      "Interesting question. Based on my analysis...",
      "I've processed your request. Here's what I found:",
      "Let me break this down for you.",
      "Based on the context available, I suggest..."
    ]
    
    addMessage({
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      metadata: {
        usedAI: true,
        contextUsed: contextCaptureEnabled && !privacyMode,
        processingTime: Math.floor(Math.random() * 500) + 100
      }
    })
    
    setAssistantStatus('idle')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    setAssistantStatus(!isListening ? 'listening' : 'idle')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col gap-4"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-light text-ayo-white">Chat</h1>
          <p className="text-ayo-muted text-xs mt-1">Interact with your assistant</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ayo-bg-card border border-ayo-border/50">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            contextCaptureEnabled && !privacyMode ? "bg-ayo-success" : "bg-ayo-muted"
          )} />
          <span className="text-[10px] text-ayo-muted uppercase tracking-wider">
            Context {contextCaptureEnabled && !privacyMode ? 'on' : 'off'}
          </span>
        </div>
      </motion.div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0" hover={false}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble key={message.id} message={message} index={index} />
            ))}
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-ayo-border/30">
          <div className="flex items-center gap-3">
            {/* Voice Input */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isListening 
                  ? "bg-ayo-error/20 text-ayo-error border border-ayo-error/30" 
                  : "bg-ayo-bg-card border border-ayo-border text-ayo-muted hover:text-ayo-silver hover:border-ayo-purple/30"
              )}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Mic className="w-4 h-4" strokeWidth={1.5} />
              )}
            </motion.button>

            {/* Text Input */}
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-2.5 bg-ayo-bg-card border border-ayo-border rounded-xl text-ayo-white text-sm placeholder-ayo-muted"
              />
            </div>

            {/* Send Button */}
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 p-0"
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>

          <p className="text-[10px] text-ayo-muted mt-2 text-center tracking-wider">
            ENTER TO SEND • HOLD SPACE FOR VOICE
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
