import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { submitReport } from '../../firebase/firestore';
import { AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'user' | 'community';
  targetId: string;
  targetContent: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetContent
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [reason, setReason] = useState<'Spam' | 'Harassment' | 'Inappropriate Content' | 'Fake Account' | 'Other'>('Spam');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await submitReport({
        reporterId: user.id,
        reporterName: user.displayName,
        targetType,
        targetId,
        targetContent,
        reason,
        notes
      });
      success('Thank you. The report has been flagged for administrative review.', 'Report Submitted');
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Content to Administration">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200/60 text-red-800 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <span>EATM enforces strict campus safety and anti-harassment regulations. False reports may be subject to review.</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Reason for reporting
          </label>
          <select
            value={reason}
            onChange={(e: any) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
          >
            <option value="Spam">Spam or misleading information</option>
            <option value="Harassment">Harassment or bullying</option>
            <option value="Inappropriate Content">Inappropriate or offensive content</option>
            <option value="Fake Account">Impersonation or fake account</option>
            <option value="Other">Other violation</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Additional Details (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Explain why this content violates university guidelines..."
            className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" size="sm" isLoading={submitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
