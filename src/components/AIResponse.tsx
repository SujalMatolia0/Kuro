import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Cpu, 
  Copy, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Info,
  Zap,
  BookOpen,
  Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AIResponseProps {
  content: string;
}

const AIResponse: React.FC<AIResponseProps> = ({ content }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to determine which icon to show for a heading
  const getHeaderIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('explanation') || t.includes('about')) return <Info size={16} className="text-accent-blue" />;
    if (t.includes('root cause') || t.includes('why')) return <Zap size={16} className="text-accent-red" />;
    if (t.includes('fix') || t.includes('step') || t.includes('instruction')) return <CheckCircle2 size={16} className="text-accent-green" />;
    if (t.includes('role') || t.includes('permission')) return <ShieldCheck size={16} className="text-accent-blue" />;
    if (t.includes('source') || t.includes('doc')) return <BookOpen size={16} className="text-accent-amber" />;
    return <Cpu size={16} className="text-text-muted" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Background Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-blue/10 to-accent-red/10 rounded-[2rem] blur opacity-30 group-hover:opacity-75 transition duration-1000" />
      
      <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-blue/10 rounded-xl">
              <Cpu size={16} className="text-accent-blue" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Llama 3.3 Intelligence</span>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-all group/copy"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover/copy:text-white">
              {copied ? "Copied" : "Copy Raw"}
            </span>
            {copied ? <CheckCircle2 size={12} className="text-accent-green" /> : <Copy size={12} className="text-text-muted group-hover/copy:text-white" />}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 prose prose-invert prose-sm max-w-none 
          prose-headings:font-black prose-headings:tracking-wider prose-headings:uppercase 
          prose-a:text-accent-blue prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-strong:font-black
          prose-code:text-accent-blue prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-ul:list-none prose-ul:pl-0
          prose-li:pl-0 prose-li:mb-2
          scrollbar-thin">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, children, ...props}) => {
                const text = String(children);
                return (
                  <h1 {...props} className="flex items-center gap-3 mt-8 mb-4 py-2 border-b border-white/5 text-sm">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      {getHeaderIcon(text)}
                    </div>
                    {children}
                  </h1>
                );
              },
              h2: ({node, children, ...props}) => {
                const text = String(children);
                return (
                  <h2 {...props} className="flex items-center gap-3 mt-6 mb-4 text-xs">
                    <div className="p-1.5 bg-white/5 rounded-md border border-white/5">
                      {getHeaderIcon(text)}
                    </div>
                    {children}
                  </h2>
                );
              },
              li: ({node, children, ...props}) => (
                <li {...props} className="flex items-start gap-3 text-text-primary/80 leading-relaxed group/li">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue/40 group-hover/li:bg-accent-blue transition-colors shrink-0" />
                  <div>{children}</div>
                </li>
              ),
              a: ({node, children, ...props}) => (
                <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 group/link">
                  {children}
                  <ExternalLink size={10} className="opacity-50 group-hover/link:opacity-100" />
                </a>
              ),
              pre: ({node, children, ...props}) => (
                <div className="relative group/code my-6">
                   <div className="absolute top-0 right-0 p-3 opacity-0 group-hover/code:opacity-100 transition-opacity">
                      <Terminal size={12} className="text-text-muted" />
                   </div>
                   <pre {...props} className="!bg-[#0a0c10] !p-6 rounded-2xl border border-white/5 overflow-x-auto shadow-inner">
                     {children}
                   </pre>
                </div>
              ),
              code: ({node, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '');
                const inline = !match;
                if (inline) return <code {...props} className="text-blue-300 font-bold bg-blue-500/10 px-1 rounded">{children}</code>;
                return <code {...props} className={className}>{children}</code>;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Action Info */}
        <div className="px-8 py-4 bg-white/[0.02] border-t border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
               <div className="w-6 h-6 rounded-full border-2 border-[#0d1117] bg-accent-blue/20 flex items-center justify-center">
                  <ShieldCheck size={12} className="text-accent-blue" />
               </div>
               <div className="w-6 h-6 rounded-full border-2 border-[#0d1117] bg-accent-green/20 flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-accent-green" />
               </div>
            </div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest italic opacity-50">Secure AI Pipeline Active</p>
          </div>
          <div className="text-[8px] font-bold text-text-muted/30 uppercase tracking-[0.2em]">Verified Documentation Scan</div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIResponse;
