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
    accountType: 'checking_account',
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
        accountType: 'checking_account',
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
      <h3 className="text-lg font-semibold text-mpf-dark mb-4">Confirma los datos de la transferencia</h3>
      
      <div className="space-y-3 bg-mpf-warmGray p-6 rounded-xl border border-gray-200/50">
        <div className="flex justify-between">
          <span className="text-gray-500">Monto:</span>
          <span className="text-mpf-dark font-semibold">{formatAmount(formData.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Banco:</span>
          <span className="text-mpf-dark">{getSelectedBank()?.name.toLowerCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tipo de cuenta:</span>
          <span className="text-mpf-dark">
            {ACCOUNT_TYPES.find(type => type.value === formData.accountType)?.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Número de cuenta:</span>
          <span className="text-mpf-dark">{formData.accountNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tipo de documento:</span>
          <span className="text-mpf-dark">
            {DOCUMENT_TYPES.find(type => type.value === formData.documentType)?.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Número de documento:</span>
          <span className="text-mpf-dark">{formData.documentNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Nombre del destinatario:</span>
          <span className="text-mpf-dark">{formData.recipientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Teléfono:</span>
          <span className="text-mpf-dark">+57 {formData.phoneNumber}</span>
        </div>
        {formData.description && (
          <div className="flex justify-between">
            <span className="text-gray-500">Descripción:</span>
            <span className="text-mpf-dark">{formData.description}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="w-full px-6 py-3 bg-mpf-warmGray text-mpf-dark rounded-xl hover:bg-mpf-warmGray/80 transition-all font-medium"
          disabled={loading}
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full px-6 py-3 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all font-medium"
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Confirmar transferencia'}
        </button>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Monto */}
      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Monto (COP)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0"
            className="w-full px-4 py-3 pl-8 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
          />
        </div>
      </div>

      {/* Banco */}
      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Banco
        </label>
        <select
          name="bankCode"
          value={formData.bankCode}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark appearance-none focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
        >
          <option value="">Selecciona un banco</option>
          {banks.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de cuenta */}
      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Tipo de cuenta
        </label>
        <select
          name="accountType"
          value={formData.accountType}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark appearance-none focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
        >
          <option value="">Selecciona el tipo de cuenta</option>
          <option value="savings_account">Cuenta de ahorros</option>
          <option value="checking_account">Cuenta corriente</option>
        </select>
      </div>

      {/* Número de cuenta */}
      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Número de cuenta
        </label>
        <input
          type="text"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleInputChange}
          placeholder="Ingresa el número de cuenta"
          className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full px-4 py-3 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 mt-4 font-medium"
      >
        {loading ? 'Procesando...' : 'Continuar'}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Tipo de documento */}
      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Tipo de documento
        </label>
        <select
          name="documentType"
          value={formData.documentType}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark appearance-none focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
        >
          {DOCUMENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Número de documento */}
      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Número de documento
        </label>
        <input
          type="text"
          name="documentNumber"
          value={formData.documentNumber}
          onChange={handleInputChange}
          placeholder="Ingresa el número de documento"
          className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
        />
      </div>

      {/* Nombre y teléfono con el mismo estilo */}
      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Nombre del destinatario
        </label>
        <input
          type="text"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleInputChange}
          placeholder="Ingresa el nombre del destinatario"
          className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
        />
      </div>

      <div>
        <label className="block text-gray-500 mb-2 text-sm">
          Teléfono
        </label>
        <input
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          placeholder="Ingresa el teléfono"
          className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(1)}
          className="w-full px-4 py-3 bg-mpf-warmGray text-mpf-dark rounded-xl hover:bg-mpf-warmGray/80 transition-all font-medium"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-3 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 font-medium"
        >
          {loading ? 'Procesando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderConfirmationStep()}
    </div>
  );
} 