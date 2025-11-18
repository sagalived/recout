
import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, Send, HelpCircle, Paperclip, Smile, User } from 'lucide-react';

export const Faq: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(`mailto:devjrmorais@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleWhatsappChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const phoneNumber = '5585999079005';
    const message = encodeURIComponent(chatMessage);
    
    // Opens WhatsApp API with pre-filled message
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setChatMessage('');
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
       <h2 className="text-[#FFD700] text-2xl font-bold mb-8 border-b border-[#FFD700]/30 pb-2 flex items-center gap-2">
        <HelpCircle className="w-6 h-6" />
        Central de Ajuda & Suporte
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
        
        {/* Left Column: Email Form */}
        <div className="bg-[#2e0249] border border-[#570a8a] rounded-xl p-8 shadow-xl flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Mail className="w-64 h-64 text-[#FFD700]" />
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-[#4a148c] rounded-full shadow-lg shadow-purple-900/50 border border-[#570a8a]">
                    <Mail className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white">Ticket por Email</h3>
                    <p className="text-xs text-purple-300">Resposta em até 24h</p>
                </div>
            </div>
            
            <form onSubmit={handleEmail} className="space-y-5 relative z-10 flex-1 flex flex-col">
                <div>
                    <label className="block text-xs font-bold text-[#FFD700] mb-1 uppercase tracking-wide">Assunto</label>
                    <input 
                        type="text" 
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full bg-[#1b002b] border border-[#570a8a] rounded-lg p-3 text-white focus:outline-none focus:border-[#FFD700] placeholder-gray-600 transition-all"
                        placeholder="Ex: Dúvida sobre cadastro..."
                        required
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-[#FFD700] mb-1 uppercase tracking-wide">Mensagem</label>
                    <textarea 
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="w-full h-full bg-[#1b002b] border border-[#570a8a] rounded-lg p-3 text-white focus:outline-none focus:border-[#FFD700] placeholder-gray-600 resize-none transition-all"
                        placeholder="Descreva seu problema ou solicitação em detalhes..."
                        required
                    ></textarea>
                </div>
                <button type="submit" className="w-full bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] font-bold py-3 rounded-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg">
                    <Send className="w-5 h-5" />
                    Enviar Email Oficial
                </button>
            </form>
        </div>

        {/* Right Column: WhatsApp Chat Widget Simulation */}
        <div className="bg-[#1b002b] border border-[#570a8a] rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
             
             {/* Chat Header */}
             <div className="bg-[#075e54] p-4 flex items-center gap-3 shadow-md z-10">
                <div className="relative">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                        <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#075e54]"></div>
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-bold text-base">Suporte Recout</h3>
                    <p className="text-green-100 text-xs">Online agora</p>
                </div>
                <MessageCircle className="w-6 h-6 text-white/80" />
             </div>

             {/* Chat Background & Messages */}
             <div className="flex-1 bg-[#0d1418] p-6 overflow-y-auto flex flex-col gap-4 relative">
                 {/* Wallpaper Pattern Effect */}
                 <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                 {/* Attendant Message */}
                 <div className="self-start max-w-[85%] bg-[#202c33] rounded-r-lg rounded-bl-lg p-3 shadow relative z-10 border border-[#2a3942]">
                     <p className="text-sm text-gray-100 leading-relaxed">
                         Olá! 👋 Bem-vindo ao suporte do Sistema Recout.
                     </p>
                     <p className="text-sm text-gray-100 leading-relaxed mt-2">
                         Como podemos ajudar você hoje? Digite sua dúvida abaixo para iniciar o atendimento no WhatsApp.
                     </p>
                     <span className="text-[10px] text-gray-400 block text-right mt-1">{currentTime}</span>
                 </div>
             </div>

             {/* Chat Input Area */}
             <div className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-[#2a3942]">
                <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors">
                    <Smile className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors">
                    <Paperclip className="w-5 h-5" />
                </button>
                
                <form onSubmit={handleWhatsappChat} className="flex-1 flex gap-2">
                    <input 
                        type="text" 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Digite uma mensagem"
                        className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-2 focus:outline-none placeholder-gray-400 text-sm"
                    />
                    <button 
                        type="submit" 
                        disabled={!chatMessage.trim()}
                        className={`p-3 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center justify-center ${chatMessage.trim() ? 'bg-[#00a884] text-white' : 'bg-[#2a3942] text-gray-500'}`}
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
             </div>
             
             {/* Disclaimer */}
             <div className="bg-[#1b002b] text-center py-2 px-4 border-t border-[#570a8a]">
                 <p className="text-[10px] text-purple-300/60">
                     Ao enviar, você será redirecionado para o WhatsApp Web/App.
                 </p>
             </div>
        </div>
      </div>
    </div>
  );
};
