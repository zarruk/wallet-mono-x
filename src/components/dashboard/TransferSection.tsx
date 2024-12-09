'use client';

import { useState } from 'react';
import { ACCOUNT_TYPES, DOCUMENT_TYPES, Bank } from '@/types/transfers';

interface TransferSectionProps {
  banks: Bank[];
  onTransfer: (transferData: any) => Promise<void>;
}

export default function TransferSection({ banks, onTransfer }: TransferSectionProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    bankCode: '',
    accountType: 'savings_account',
    accountNumber: '',
    documentType: 'CC',
    documentNumber: '',
    recipientName: '',
    phoneNumber: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSelectedBank = () => {
    return banks.find(bank => bank.code === formData.bankCode);
  };

  const getSupportedAccountTypes = () => {
    const bank = getSelectedBank();
    return bank ? ACCOUNT_TYPES.filter(type => 
      bank.supported_account_types.includes(type.value)
    ) : ACCOUNT_TYPES;
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(amount || '0'));
  };

  const validateForm = () => {
    if (step === 1) {
      if (!formData.amount || parseFloat(formData.amount) <= 0) return 'Monto inválido';
      if (!formData.bankCode) return 'Selecciona un banco';
      if (!formData.accountNumber) return 'Número de cuenta requerido';
      return '';
    }

    if (step === 2) {
      if (!formData.documentNumber) return 'Número de documento requerido';
      if (!formData.recipientName) return 'Nombre del destinatario requerido';
      if (!formData.phoneNumber || !/^\d{10}$/.test(formData.phoneNumber)) 
        return 'Teléfono debe tener 10 dígitos';
      return '';
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (step === 1) {
      setStep(2);
      setError('');
      return;
    }

    if (step === 2) {
      setStep(3);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onTransfer({
        ...formData,
        amount: parseFloat(formData.amount) * 100, // Convertir a centavos
        phoneNumber: `+57${formData.phoneNumber}`
      });
      // Resetear formulario después de transferencia exitosa
      setFormData({
        amount: '',
        bankCode: '',
        accountType: 'savings_account',
        accountNumber: '',
        documentType: 'CC',
        documentNumber: '',
        recipientName: '',
        phoneNumber: '',
        description: ''
      });
      setStep(1);
    } catch (err: any) {
      setError(err.message || 'Error al realizar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  const renderConfirmationStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Confirma los datos de la transferencia</h3>
      
      <div className="space-y-3 bg-mono-dark/50 p-4 rounded-xl">
        <div className="flex justify-between">
          <span className="text-gray-400">Monto:</span>
          <span className="text-white font-medium">{formatAmount(formData.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Banco:</span>
          <span className="text-white">{getSelectedBank()?.name.toLowerCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Tipo de cuenta:</span>
          <span className="text-white">
            {ACCOUNT_TYPES.find(type => type.value === formData.accountType)?.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Número de cuenta:</span>
          <span className="text-white">{formData.accountNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Tipo de documento:</span>
          <span className="text-white">
            {DOCUMENT_TYPES.find(type => type.value === formData.documentType)?.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Número de documento:</span>
          <span className="text-white">{formData.documentNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Nombre del destinatario:</span>
          <span className="text-white">{formData.recipientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Teléfono:</span>
          <span className="text-white">+57 {formData.phoneNumber}</span>
        </div>
        {formData.description && (
          <div className="flex justify-between">
            <span className="text-gray-400">Descripción:</span>
            <span className="text-white">{formData.description}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="w-full px-6 py-3 bg-mono-dark text-white rounded-xl hover:bg-opacity-90 transition-all"
          disabled={loading}
        >
          Atrás
        </button>
        <button
          type="submit"
          className="w-full px-6 py-3 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all"
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Confirmar transferencia'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 ? (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Monto (COP)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Banco</label>
              <select
                name="bankCode"
                value={formData.bankCode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                required
              >
                <option value="">Selecciona un banco</option>
                {banks.map(bank => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Tipo de cuenta</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                required
              >
                {getSupportedAccountTypes().map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Número de cuenta</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all"
              disabled={loading}
            >
              Continuar
            </button>
          </>
        ) : step === 2 ? (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tipo de documento</label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                required
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Número de documento</label>
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre del destinatario</label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Teléfono</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
                placeholder="3001234567"
                pattern="\d{10}"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Descripción (opcional)</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full px-6 py-3 bg-mono-dark text-white rounded-xl hover:bg-opacity-90 transition-all"
                disabled={loading}
              >
                Atrás
              </button>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all"
                disabled={loading}
              >
                Continuar
              </button>
            </div>
          </>
        ) : (
          renderConfirmationStep()
        )}
      </form>
    </>
  );
} 