import React from 'react';

/**
 * ConfirmModal - A premium confirmation dialog
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {string} title - Main heading
 * @param {string} message - Description text
 * @param {string} confirmText - Text for the primary action button
 * @param {string} cancelText - Text for the secondary button
 * @param {function} onConfirm - Action to run on confirm
 * @param {function} onCancel - Action to run on cancel
 * @param {string} type - 'danger' (red) or 'primary' (brand color)
 */
export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'primary'
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="p-8 text-center bg-white relative">
                    <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-2xl mb-6 shadow-sm
                        ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-brand/5 text-brand'}`}>
                        {type === 'danger' ? '👋' : '✨'}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h3>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed px-2">{message}</p>
                    </div>
                </div>

                <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-5 bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-5 bg-white text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-50 active:scale-95
                            ${type === 'danger' ? 'text-red-600' : 'text-brand'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
