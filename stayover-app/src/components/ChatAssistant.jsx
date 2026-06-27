import React, { useState } from 'react';

export default function ChatAssistant() {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: 'I\'ve crafted an 18-hour itinerary for Singapore. I booked luggage storage near the MRT and added a street food tour. How does that look?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        const newMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'ai',
                text: 'Generating new route... Swapping the museum for the Night Safari. Total affiliate discount added: 10%.'
            }]);
        }, 1500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '300px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 8px #4caf50' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Stayover AI Concierge</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '0.8rem 1rem',
                        borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        background: msg.sender === 'user' ? 'var(--color-bg-elevated)' : 'var(--gradient-gold)',
                        color: msg.sender === 'user' ? 'var(--color-text-primary)' : '#0a0a0c',
                        border: msg.sender === 'user' ? '1px solid var(--color-border)' : 'none',
                        fontSize: '0.9rem'
                    }}>
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ display: 'flex', padding: '1rem', gap: '0.5rem', borderTop: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="e.g., 'Swap museum for street food...'"
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-text-primary)', outline: 'none', fontSize: '0.9rem' }}
                />
                <button type="submit" style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
                    Send
                </button>
            </form>
        </div>
    );
}
