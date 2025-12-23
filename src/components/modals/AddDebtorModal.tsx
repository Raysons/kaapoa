import React, { useMemo, useState } from 'react';
import { X, Check, User, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useDebtors } from '@/hooks/useDebtors';
interface AddDebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDebtorAdded?: () => void;
}
export function AddDebtorModal({
  isOpen,
  onClose,
  onDebtorAdded,
}: AddDebtorModalProps) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [paymentType, setPaymentType] = useState('INSTALLMENT');
  const [submitting, setSubmitting] = useState(false);

  const { addDebtor } = useDebtors();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [paymentFrequency, setPaymentFrequency] = useState<string>('Monthly');

  const canSubmit = useMemo(() => {
    return mode === 'new' && name.trim().length > 0 && phone.trim().length > 0;
  }, [mode, name, phone]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addDebtor({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        credit_limit: Number(creditLimit) || 0,
        outstanding_balance: Number(outstandingBalance) || 0,
        notes: notes.trim() || null,
        is_active: true,
        payment_type: paymentType,
        installment_amount: paymentType === 'INSTALLMENT' ? Number(installmentAmount) || 0 : null,
        payment_frequency: paymentType === 'INSTALLMENT' ? paymentFrequency : null,
        custom_schedule: paymentType === 'CUSTOM' ? { note: 'custom' } : null,
      });

      toast({ title: 'Success', description: 'Debtor added successfully' });

      setStep(1);
      setMode('new');
      setPaymentType('INSTALLMENT');
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCreditLimit(0);
      setOutstandingBalance(0);
      setNotes('');
      setInstallmentAmount(0);
      setPaymentFrequency('Monthly');

      onDebtorAdded?.();
      onClose();
    } catch (error: any) {
      console.error('Add debtor failed:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to add debtor', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Select Mode
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Choose whether to add a new debtor or add more debt to an existing
              one
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => setMode('new')} className={`p-6 rounded-lg border-2 text-center transition-all ${mode === 'new' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <User className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">New Debtor</h4>
                <p className="text-xs text-gray-500">
                  Add a new customer to your system
                </p>
              </button>

              <button onClick={() => setMode('existing')} className={`p-6 rounded-lg border-2 text-center transition-all ${mode === 'existing' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">
                  Existing Debtor
                </h4>
                <p className="text-xs text-gray-500">
                  Update existing customer information
                </p>
              </button>
            </div>
          </>;
      case 2:
        return <>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Personal Information
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Enter basic personal information for the new debtor
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address (Optional)
                  </label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-blue-50" />
                </div>
              </div>
            </div>
          </>;
      case 3:
        return <>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Financial Information
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Set credit limits and initial debt amount
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Credit Limit (KSh)
                  </label>
                  <input type="number" value={creditLimit} onChange={e => setCreditLimit(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Debt Amount (KSh)
                  </label>
                  <input type="number" value={outstandingBalance} onChange={e => setOutstandingBalance(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input type="date" placeholder="dd/mm/yyyy" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes about this debtor..." className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none"></textarea>
              </div>
            </div>
          </>;
      case 4:
        return <>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Payment Terms & Review
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Configure payment terms and review details
            </p>

            {/* Payment Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Preferred Payment Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setPaymentType('FULL')} className={`p-4 rounded-lg border-2 text-center transition-all ${paymentType === 'FULL' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <h4 className="font-bold text-gray-900 mb-1">FULL</h4>
                  <p className="text-xs text-gray-500">
                    Pay full amount at once
                  </p>
                </button>

                <button onClick={() => setPaymentType('INSTALLMENT')} className={`p-4 rounded-lg border-2 text-center transition-all ${paymentType === 'INSTALLMENT' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <h4 className="font-bold text-gray-900 mb-1">INSTALLMENT</h4>
                  <p className="text-xs text-gray-500">
                    Fixed regular installments
                  </p>
                </button>

                <button onClick={() => setPaymentType('CUSTOM')} className={`p-4 rounded-lg border-2 text-center transition-all ${paymentType === 'CUSTOM' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <h4 className="font-bold text-gray-900 mb-1">CUSTOM</h4>
                  <p className="text-xs text-gray-500">
                    Custom payment schedule
                  </p>
                </button>
              </div>
            </div>

            {/* Installment Details */}
            {paymentType === 'INSTALLMENT' && <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Installment Amount (KSh)
                  </label>
                  <input type="number" value={installmentAmount} onChange={e => setInstallmentAmount(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Payment Frequency
                  </label>
                  <select value={paymentFrequency} onChange={e => setPaymentFrequency(e.target.value)} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option>Monthly</option>
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Quarterly</option>
                  </select>
                </div>
              </div>}

            {/* Review Details */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-bold text-gray-900 mb-3">Review Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="font-medium text-gray-900">KSh {Number(creditLimit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Debt:</span>
                  <span className="font-medium text-gray-900">KSh {Number(outstandingBalance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Type:</span>
                  <span className="font-medium text-gray-900">
                    {paymentType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Installment:</span>
                  <span className="font-medium text-gray-900">
                    KSh {Number(installmentAmount || 0).toLocaleString()} ({String(paymentFrequency || '').toLowerCase()})
                  </span>
                </div>
              </div>
            </div>
          </>;
      default:
        return null;
    }
  };
  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Choose whether to add a new debtor or add more debt to an existing one';
      case 2:
        return 'Enter basic personal information for the new debtor';
      case 3:
        return 'Set credit limits and initial debt amount';
      case 4:
        return 'Configure payment terms and review details';
      default:
        return '';
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-blue-100 hover:text-white hover:bg-blue-500 rounded-full p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold mb-1">Add Debtor</h2>
          <p className="text-blue-100 text-sm mb-6">{getStepTitle()}</p>

          {/* Stepper */}
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-white text-blue-600' : 'bg-blue-700 text-blue-300'}`}>
                {step > 1 ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <div className="ml-2">
                <p className={`text-xs ${step >= 1 ? 'text-white font-medium' : 'text-blue-300'}`}>
                  Mode
                </p>
              </div>
            </div>
            <div className={`h-0.5 flex-1 mx-3 ${step > 1 ? 'bg-white' : 'bg-blue-700'}`}></div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-white text-blue-600' : 'bg-blue-700 text-blue-300'}`}>
                {step > 2 ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <div className="ml-2">
                <p className={`text-xs ${step >= 2 ? 'text-white font-medium' : 'text-blue-300'}`}>
                  Personal
                </p>
              </div>
            </div>
            <div className={`h-0.5 flex-1 mx-3 ${step > 2 ? 'bg-white' : 'bg-blue-700'}`}></div>

            {/* Step 3 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-white text-blue-600' : 'bg-blue-700 text-blue-300'}`}>
                {step > 3 ? <Check className="h-5 w-5" /> : '3'}
              </div>
              <div className="ml-2">
                <p className={`text-xs ${step >= 3 ? 'text-white font-medium' : 'text-blue-300'}`}>
                  Financial
                </p>
              </div>
            </div>
            <div className={`h-0.5 flex-1 mx-3 ${step > 3 ? 'bg-white' : 'bg-blue-700'}`}></div>

            {/* Step 4 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 4 ? 'bg-orange-500 text-white' : 'bg-blue-700 text-blue-300'}`}>
                4
              </div>
              <div className="ml-2">
                <p className={`text-xs ${step >= 4 ? 'text-white font-medium' : 'text-blue-300'}`}>
                  Payment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          {step === 1 ? (
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={submitting}>
              <span>←</span>
              Previous
            </Button>
          )}

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={submitting || (step === 2 && mode === 'new' && (!name.trim() || !phone.trim()))}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
              <Check className="h-4 w-4" />
              Add Debtor
            </Button>
          )}
        </div>
      </div>
    </div>;
}