import { getAssetURL } from '../utils/api'
import { IconClose, IconCheck, IconWarning, IconDocument } from '../components/icons'
import StatusBadge from './StatusBadge'

export default function ActivityModal({ item, onClose }) {
    if (!item) return null;

    const isAdmin = item.updated_by_role === 'Admin';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Activity Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><IconClose className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-6 text-sm max-h-[80vh] overflow-y-auto">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated By</span>
                            <p className="mt-1 font-bold text-slate-700">
                                {isAdmin ? `[Admin] ${item.updated_by_name}` : 'You'}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                            <p className="mt-1 font-bold text-slate-700">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Core Commitment (The Context) */}
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Commitment</span>
                        <p className="mt-1.5 font-medium text-slate-600 bg-white border border-slate-100 p-3 rounded-lg italic text-xs leading-relaxed shadow-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                            "{item.commitment_text || 'No commitment text captured for this log.'}"
                        </p>
                    </div>

                    {isAdmin ? (
                        /* Admin Feedback View */
                        <div className="space-y-4 pt-2 border-t border-slate-50">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review Status</span>
                                <p className={`mt-1 font-black uppercase tracking-widest text-[11px] px-3 py-1 rounded-full border inline-flex items-center gap-1.5
                                    ${['APPROVED', 'PROGRESS_APPROVED'].includes(item.status) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    {['APPROVED', 'PROGRESS_APPROVED'].includes(item.status) ? <><IconCheck className="w-3 h-3" /> Approved</> : <><IconWarning className="w-3 h-3" /> Declined</>}
                                </p>
                            </div>
                            {['DECLINED', 'REJECTED', 'PROGRESS_REJECTED'].includes(item.status) && (
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback / Reason</span>
                                    <p className="mt-1.5 font-medium text-red-700 bg-red-50/50 p-4 rounded-xl border border-red-100/50 text-xs shadow-inner leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {(item.measurable_impact || 'No specific feedback provided.')
                                            .replace('Review Declined: ', '')
                                            .replace('Commitment Rejected: ', '')
                                            .replace('Commitment Declined: ', '')
                                            .replace('Progress Update Declined: ', '')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* User Submission View */
                        <div className="space-y-5 pt-2 border-t border-slate-50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Update</span>
                                    <div className="mt-1"><StatusBadge status={item.status} /></div>
                                </div>
                                {item.attachment_url && (
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence</span>
                                        <a href={getAssetURL(item.attachment_url)} target="_blank" className="mt-1 flex items-center gap-1.5 text-brand hover:text-brand-dark font-black text-[10px] uppercase tracking-widest transition-colors">
                                            <IconDocument className="w-3.5 h-3.5" /> View Attachment
                                        </a>
                                    </div>
                                )}
                            </div>

                            {['Achieved', 'ACHIEVED'].includes(item.status) && (
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Measurable Impact</span>
                                    <p className="mt-1.5 font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {item.measurable_impact || 'No impact details provided.'}
                                    </p>
                                </div>
                            )}

                            {item.challenges && (
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Progress</span>
                                    <p className="mt-1.5 font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {item.challenges}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
