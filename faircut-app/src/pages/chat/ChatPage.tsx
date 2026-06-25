import { useState } from 'react'
import { Send, Paperclip, Bot } from 'lucide-react'
import { mockProjects, mockMessages } from '../../data/mockData'
import { formatDateTime } from '../../lib/utils'
import type { Message } from '../../types'

const msgBg: Record<string, string> = {
  text: '',
  brief: 'bg-navy-50 border border-navy/20',
  deliverable: 'bg-emerald-50 border border-emerald-200',
  revision_request: 'bg-amber-50 border border-amber-200',
  ai_summary: 'bg-purple-50 border border-purple-200',
  system: 'bg-gray-50 border border-gray-200 text-center w-full',
}
const msgIcon: Record<string, string> = { brief:'📄', deliverable:'📦', revision_request:'✏️', ai_summary:'🤖', system:'⚙️' }

export default function ChatPage() {
  const [activeProject, setActiveProject] = useState(mockProjects[0].project_id)
  const [input, setInput] = useState('')
  const messages = mockMessages.filter(m => m.project_id === activeProject)
  const myId = 'u2'

  const renderMsg = (m: Message) => {
    const isMe = m.sender_id === myId
    const isSystem = m.message_type === 'system'
    if (isSystem) return (
      <div key={m.message_id} className="flex justify-center my-2">
        <span className="text-xs bg-gray-100 text-navy/50 px-3 py-1 rounded-full">{msgIcon.system} {m.body}</span>
      </div>
    )
    return (
      <div key={m.message_id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {m.message_type === 'ai_summary' ? <Bot className="w-4 h-4"/> : m.sender_name.split(' ').map(n=>n[0]).slice(0,2).join('')}
        </div>
        <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
          {!isMe && <span className="text-xs text-navy/50 px-1">{m.sender_name}</span>}
          <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-navy text-white rounded-tr-sm' : `bg-white border border-border rounded-tl-sm ${msgBg[m.message_type]??''}`}`}>
            {m.message_type !== 'text' && <p className="text-xs font-semibold opacity-70 mb-1">{msgIcon[m.message_type]} {m.message_type.replace(/_/g,' ').toUpperCase()}</p>}
            {m.body}
          </div>
          <span className="text-[10px] text-navy/30 px-1">{formatDateTime(m.created_at)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 bg-white rounded-2xl border border-border overflow-hidden">
      {/* Project list */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-navy/40 uppercase tracking-wider">Projects</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mockProjects.filter(p=>!['draft','cancelled'].includes(p.status)).map(p=>(
            <button key={p.project_id} onClick={()=>setActiveProject(p.project_id)}
              className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${activeProject===p.project_id?'bg-navy-50':'hover:bg-primary-200'}`}>
              <p className="text-sm font-medium text-navy leading-tight truncate">{p.title}</p>
              <p className="text-xs text-navy/50 mt-0.5 truncate">{p.client_name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3 border-b border-border">
          <p className="font-semibold text-navy text-sm">{mockProjects.find(p=>p.project_id===activeProject)?.title}</p>
          <p className="text-xs text-navy/50">{mockProjects.find(p=>p.project_id===activeProject)?.client_name}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length===0 ? <p className="text-center text-sm text-navy/30 pt-10">No messages yet</p> : messages.map(renderMsg)}
        </div>
        <div className="p-4 border-t border-border flex gap-3 items-end">
          <button className="p-2.5 rounded-xl border border-border text-navy/40 hover:text-navy hover:bg-primary-200 transition-colors flex-shrink-0">
            <Paperclip className="w-4 h-4"/>
          </button>
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a message…"
            className="flex-1 input py-2.5" onKeyDown={e=>e.key==='Enter'&&setInput('')}/>
          <button onClick={()=>setInput('')} className="btn-primary py-2.5 px-4 flex-shrink-0">
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  )
}
