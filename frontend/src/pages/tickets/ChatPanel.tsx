import { useCallback, useEffect, useRef, useState } from "react"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Send, X, Check, CheckCheck, FileText, Mic } from "lucide-react"
import { useChatStore } from "@/stores/chatStore"
import { AudioPlayer } from "@/components/chat/AudioPlayer"
import { AudioRecorder } from "@/components/chat/AudioRecorder"
import { useTicketStore } from "@/stores/ticketStore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { ScrollArea } from "@/components/ui/ScrollArea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import type { Ticket, Message } from "@/types"

interface ChatPanelProps {
  ticket: Ticket
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function MessageDateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
        {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>
    </div>
  )
}

function MessageBubble({ message, showDate }: { message: Message; showDate: boolean }) {
  const isFromMe = message.fromMe

  return (
    <>
      {showDate && <MessageDateSeparator date={new Date(message.createdAt)} />}

      <div
        className={cn(
          "flex gap-2 mb-3",
          isFromMe ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-2",
            isFromMe
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200/60"
          )}
        >
          {message.mediaType === "audio" && message.mediaUrl ? (
            <AudioPlayer
              src={`/public/${message.mediaUrl}`}
              isFromMe={isFromMe}
            />
          ) : message.mediaType === "image" && message.mediaUrl ? (
            <div className="mb-1">
              <img
                src={`/public/${message.mediaUrl}`}
                alt="Imagem"
                className="max-w-full rounded-lg"
                loading="lazy"
              />
              {message.body && (
                <p className={cn(
                  "mt-1 text-sm whitespace-pre-wrap break-words",
                  isFromMe ? "text-white" : "text-[#0A0A0A]"
                )}>
                  {message.body}
                </p>
              )}
            </div>
          ) : message.mediaType && message.mediaUrl ? (
            <div className="flex items-center gap-2 mb-1">
              {message.mediaType === "video" ? (
                <video
                  src={`/public/${message.mediaUrl}`}
                  controls
                  className="max-w-full rounded-lg"
                />
              ) : (
                <a
                  href={`/public/${message.mediaUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    isFromMe
                      ? "border-blue-400 text-white hover:bg-blue-500"
                      : "border-gray-200 text-blue-600 hover:bg-gray-50"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Documento
                </a>
              )}
            </div>
          ) : (
            <p className={cn(
              "text-sm whitespace-pre-wrap break-words",
              isFromMe ? "text-white" : "text-[#0A0A0A]"
            )}>
              {message.body}
            </p>
          )}

          <div className={cn(
            "flex items-center gap-1 mt-1",
            isFromMe ? "justify-end" : "justify-start"
          )}>
            <span className={cn(
              "text-xs",
              isFromMe ? "text-blue-100" : "text-gray-500"
            )}>
              {format(new Date(message.createdAt), "HH:mm")}
            </span>

            {isFromMe && (
              <span className="text-blue-100">
                {message.ack >= 3 ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ChatPanel({ ticket }: ChatPanelProps) {
  const { messages, isLoading, fetchMessages, sendMessage, sendAudioMessage, clearMessages, markAsRead } = useChatStore()
  const { clearSelection } = useTicketStore()

  const [messageInput, setMessageInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ticket) {
      fetchMessages(ticket.id)
      markAsRead(ticket.id)
    }

    return () => {
      clearMessages()
    }
  }, [ticket.id])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      return
    }

    try {
      await sendMessage(ticket.id, messageInput.trim())
      setMessageInput("")
    } catch (error) {
      // Error handling can be added here (e.g., toast notification)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCloseTicket = () => {
    clearSelection()
  }

  const handleAudioSend = useCallback(
    async (blob: Blob, mimeType: string, duration: number) => {
      try {
        await sendAudioMessage(ticket.id, blob, mimeType, duration)
      } catch {
        // Error handling can be added here (e.g., toast notification)
      } finally {
        setIsRecording(false)
      }
    },
    [ticket.id, sendAudioMessage]
  )

  const statusColors = {
    open: "bg-green-500",
    pending: "bg-yellow-500",
    closed: "bg-gray-400"
  }

  const statusLabels = {
    open: "Aberto",
    pending: "Pendente",
    closed: "Fechado"
  }

  return (
    <div className="flex flex-col h-full">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={ticket.contact?.profilePicUrl} alt={ticket.contact?.name} />
              <AvatarFallback>
                {getInitials(ticket.contact?.name || "?")}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="font-semibold text-[#0A0A0A]">
                {ticket.contact?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {ticket.contact?.number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", statusColors[ticket.status])} />
              <span className="text-sm text-gray-600">
                {statusLabels[ticket.status]}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseTicket}
              className="hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* MESSAGE AREA */}
      <ScrollArea className="flex-1 bg-gray-50" ref={scrollAreaRef}>
        <div className="p-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <p className="text-gray-500">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const previousMessage = index > 0 ? messages[index - 1] : null
                const showDate = !previousMessage ||
                  !isSameDay(
                    new Date(message.createdAt),
                    new Date(previousMessage.createdAt)
                  )

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showDate={showDate}
                  />
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* INPUT AREA */}
      <div className="bg-white border-t border-gray-200/60 p-4">
        <div className="flex items-end gap-2">
          {isRecording ? (
            <AudioRecorder
              onSend={handleAudioSend}
              onCancel={() => setIsRecording(false)}
            />
          ) : (
            <>
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                rows={1}
                className={cn(
                  "flex-1 resize-none rounded-2xl border border-gray-200 bg-white",
                  "px-4 py-3 text-sm text-[#0A0A0A] placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
                  "min-h-[44px] max-h-32"
                )}
                style={{
                  height: "auto",
                  minHeight: "44px"
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`
                }}
              />

              {messageInput.trim() ? (
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRecording(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title="Gravar audio"
                  data-testid="chat-mic-button"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
