import React, { useState } from 'react';

interface QuestionWidgetProps {
  onClose?: () => void;
  onSubmit: (answer: string) => void;
  question: string;
}

const QuestionWidget: React.FC<QuestionWidgetProps> = ({ onClose, onSubmit, question }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (answer.trim()) {
      onSubmit(answer);
      setAnswer('');
    }
  };

  return (
    <div className="h-full bg-soft-cream flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 w-full">
      {/* Header */}
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div>
          <h2 className="serif-font text-3xl text-primary">Information Needed</h2>
          <p className="text-gray-500 text-xs font-medium mt-1">
            Please provide the following details
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="size-8 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col justify-center">
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm text-center mb-8">
            <div className="size-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl text-primary">help</span>
            </div>
            <h3 className="serif-font text-2xl text-primary mb-3 leading-tight">{question}</h3>
            <p className="text-gray-500 text-sm">Your input helps our AI assistant coordinate more effectively.</p>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label htmlFor="answer" className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Your Answer</label>
                <textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white border-0 ring-1 ring-black/5 focus:ring-2 focus:ring-primary text-primary placeholder:text-gray-300 transition-all resize-none text-lg min-h-[120px]"
                    placeholder="Type your response here..."
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
            </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-black/5 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => handleSubmit()}
          disabled={!answer.trim()}
          className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${answer.trim()
              ? 'bg-primary text-white shadow-lg shadow-black/5 hover:bg-black active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          <span>Submit Answer</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default QuestionWidget;
