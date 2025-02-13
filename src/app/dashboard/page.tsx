'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import dynamic from 'next/dynamic';
import TransferSection from '@/components/dashboard/TransferSection';
import { Bank } from '@/types/transfers';

// Cargar componentes pesados de forma dinámica
const CardsSection = dynamic(() => import('@/components/dashboard/CardsSection'), {
  loading: () => <p>Cargando tarjetas...</p>
});

interface ClientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  document_number: string;
  phone: string;
  mono_ledger_account_id: string;
  birth_date?: string;
  company_name: string;
  company_logo_url?: string;
}

interface Balance {
  available: {
    currency: string;
    amount: number;
  };
}

interface Transaction {
  id: string;
  description: string;
  amount: {
    currency: string;
    amount: number;
  };
  transaction_at: string;
  operation_type: 'credit' | 'debit';
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination?: {
    total_pages: number;
  };
  error?: string;
}

interface MonoCard {
  id: string;
  state: string;
  nickname: string;
  account_id: string;
  last_four: string;
  configuration_group_id: string;
  cardholder_id: string;
  card_art_url?: string;  // Agregamos esta propiedad
}

interface DatabaseCard {
  id: number;
  user_id: string;
  card_id: string;
  cardholder_id: string;
  account_id: string;
  last_four: string;
  nickname: string;
  state: string;
  configuration_group_id: string;
}

interface UIState {
  loading: boolean;
  transactionsLoading: boolean;
  cardsLoading: boolean;
  error: string | null;
  showBirthDateModal: boolean;
  showNicknameModal: boolean;
  showTransferModal: boolean;
  showRechargeModal: boolean;
  isSubmitting: boolean;
  showFICWithdrawModal: boolean;
  withdrawAmount: string;
}

const Dashboard = () => {
  const router = useRouter();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [uiState, setUiState] = useState({
    loading: true,
    transactionsLoading: true,
    cardsLoading: true,
    error: null,
    showBirthDateModal: false,
    showNicknameModal: false,
    showTransferModal: false,
    showRechargeModal: false,
    isSubmitting: false,
    showFICWithdrawModal: false,
    withdrawAmount: '',
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cards, setCards] = useState<MonoCard[]>([]);
  const [birthDate, setBirthDate] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const controls = useAnimation();
  const [dragStartX, setDragStartX] = useState(0);
  const [cardNickname, setCardNickname] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const predefinedAmounts = [50000, 100000, 200000];
  const [selectedInvestment, setSelectedInvestment] = useState<{
    name: string;
    type: string;
    return: string;
    minAmount: number;
    description?: string;
    term?: string;
    risk?: string;
  } | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');

  const fetchUserCards = useCallback(async () => {
    if (!clientData?.id) return;
    
    try {
      const { data: dbCards, error } = await supabase
        .from('wallet_mono_ix_cards')
        .select('*')
        .eq('user_id', clientData.id);

      if (error) throw error;

      if (dbCards && dbCards.length > 0) {
        setCards(dbCards.map(card => ({
          id: card.card_id,
          state: card.state,
          nickname: card.nickname,
          account_id: card.account_id,
          last_four: card.last_four,
          configuration_group_id: card.configuration_group_id,
          cardholder_id: card.cardholder_id
        })));
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      setCards([]);
    }
  }, [clientData?.id]);

  // Función para guardar la tarjeta en Supabase después de crearla
  const saveCardToDatabase = async (cardData: MonoCard) => {
    const { error } = await supabase
      .from('wallet_mono_ix_cards')
      .insert({
        user_id: clientData?.id,
        card_id: cardData.id,
        cardholder_id: cardData.cardholder_id,
        account_id: cardData.account_id,
        last_four: cardData.last_four,
        nickname: cardData.nickname,
        state: cardData.state,
        configuration_group_id: cardData.configuration_group_id
      });

    if (error) throw error;
  };

  // Modificar handleCreateCardholder para guardar la tarjeta
  const handleCreateCard = async () => {
    if (!cardNickname.trim()) {
      alert('Por favor ingresa un nombre para tu tarjeta');
      return;
    }

    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      // Si ya existe birth_date en clientData, usarlo
      const birthDateToUse = clientData?.birth_date || birthDate;
      
      const response = await fetch('/api/mono/v1/cards/cardholders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: clientData,
          birthDate: birthDateToUse,
          nickname: cardNickname
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el cardholder');
      }

      // Guardar en Supabase y actualizar el estado
      await saveCardToDatabase(data.cardData);
      setCards(prevCards => [...prevCards, data.cardData]);
      setUiState(prev => ({ 
        ...prev, 
        showBirthDateModal: false,
        showNicknameModal: false 
      }));
      setCardNickname('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la tarjeta. Por favor intenta nuevamente.');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Carrusel de tarjetas
  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleDragStart = () => {
    setDragStartX(currentCardIndex * -100);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const dragDistance = info.offset.x;
    const swipeThreshold = 50; // Ajustar según necesidad

    if (dragDistance > swipeThreshold && currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    } else if (dragDistance < -swipeThreshold && currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }

    controls.start({
      x: currentCardIndex * -100 + '%',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    });
  };

  // 1. Separar la lógica de fetchBalance en una función independiente
  const fetchBalance = async (accountId: string) => {
    console.log('Fetching fresh balance...');
    const timestamp = new Date().getTime();
    const balanceResponse = await fetch(
      `/api/mono/v1/balance?account_id=${accountId}&_t=${timestamp}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );

    const balanceData = await balanceResponse.json();
    if (!balanceResponse.ok) {
      throw new Error(balanceData.error || 'Error al obtener el saldo');
    }

    return balanceData;
  };

  // Después de fetchBalance y antes de los useEffect
  const fetchTransactions = useCallback(async () => {
    if (!clientData?.mono_ledger_account_id) return;
    
    try {
      setUiState(prev => ({ ...prev, transactionsLoading: true }));
      console.log('Fetching transactions...');
      
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/mono/v1/ledger/accounts/${clientData.mono_ledger_account_id}/transactions?page=${currentPage}&_t=${timestamp}&sort[field]=transaction_at&sort[type]=desc`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );

      const transactionsData: TransactionsResponse = await response.json();

      if (!response.ok) {
        const errorMessage = response.status === 422 
          ? 'Error en el formato de la solicitud'
          : transactionsData.error || 'Error al obtener las transacciones';
        throw new Error(errorMessage);
      }

      setTransactions(transactionsData.transactions || []);
      setTotalPages(transactionsData.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setUiState(prev => ({ ...prev, transactionsLoading: false }));
    }
  }, [clientData?.mono_ledger_account_id, currentPage]);

  // 2. Corregir las dependencias de los useEffect
  // Primer useEffect para auth y datos iniciales
  useEffect(() => {
    const checkAuth = async () => {
      const session = localStorage.getItem('userSession');
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('wallet_mono_ix_users')
          .select(`
            id,
            first_name,
            last_name,
            email,
            document_number,
            phone,
            mono_ledger_account_id,
            birth_date,
            company_name,
            company_logo_url
          `)
          .eq('email', localStorage.getItem('userEmail'))
          .single();

        if (error) throw error;
        setClientData(data);

        // Obtener el balance de Mono con un timestamp para evitar caché
        if (data.mono_ledger_account_id) {
          console.log('Fetching fresh balance...');
          const timestamp = new Date().getTime();
          const balanceResponse = await fetch(
            `/api/mono/v1/balance?account_id=${data.mono_ledger_account_id}&_t=${timestamp}`,
            {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            }
          );

          const balanceData = await balanceResponse.json();
          console.log('Fresh balance data received:', balanceData);

          if (!balanceResponse.ok) {
            throw new Error(balanceData.error || 'Error al obtener el saldo');
          }

          if (balanceData.error) {
            console.error('Balance error:', balanceData.error);
            setBalance(0);
          } else {
            setBalance(Number(balanceData.available) / 100);
          }
        }

        if (data.mono_ledger_account_id) {
          fetchTransactions();
        }
      } catch (error: any) {
        console.error('Error:', error);
        router.push('/login');
      } finally {
        setUiState(prev => ({ ...prev, loading: false }));
      }
    };

    checkAuth();
  }, [router]); // Solo depende del router

  // Segundo useEffect para tarjetas
  useEffect(() => {
    if (clientData?.id) {
      fetchUserCards();
    }
  }, [clientData?.id, fetchUserCards]);

  // Tercer useEffect para transacciones
  useEffect(() => {
    const fetchData = async () => {
      if (clientData?.mono_ledger_account_id) {
        await fetchTransactions();
      }
    };
    fetchData();
  }, [clientData?.mono_ledger_account_id, fetchTransactions]);

  const handleTransfer = async (transferData: any) => {
    try {
      const response = await fetch('/api/mono/v1/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transferData,
          userId: clientData?.id,
          accountId: clientData?.mono_ledger_account_id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la transferencia');
      }

      // Actualizar el balance
      const timestamp = new Date().getTime();
      const balanceResponse = await fetch(
        `/api/mono/v1/ledger/accounts/${clientData?.mono_ledger_account_id}/balances?_t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );

      const balanceData = await balanceResponse.json();
      if (balanceResponse.ok) {
        setBalance(balanceData.available.amount / 100);
      }

      // Actualizar las transacciones
      const transactionsResponse = await fetch(
        `/api/mono/v1/ledger/accounts/${clientData?.mono_ledger_account_id}/transactions?page=1&_t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );

      const transactionsData = await transactionsResponse.json();
      if (transactionsResponse.ok) {
        setTransactions(transactionsData.transactions || []);
        setTotalPages(transactionsData.pagination?.total_pages || 1);
        setCurrentPage(1); // Volver a la primera página
      }
      
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al procesar la transferencia');
    }
  };

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('/api/mono/v1/banks');
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        // Convertir nombres a minúsculas y ordenar alfabéticamente
        const formattedBanks = data.banks.map((bank: Bank) => ({
          ...bank,
          name: bank.name.toLowerCase()
        })).sort((a: Bank, b: Bank) => a.name.localeCompare(b.name));
        
        setBanks(formattedBanks);
      } catch (error) {
        console.error('Error fetching banks:', error);
      }
    };

    fetchBanks();
  }, []);

  const handlePSERecharge = async () => {
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      // 1. Simular que el usuario fue a PSE
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos

      // 2. Hacer la recarga
      const response = await fetch('/api/mono/v1/recharges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(rechargeAmount),
          userId: clientData?.id,
          accountId: clientData?.mono_ledger_account_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la recarga');
      }

      // 3. Cerrar el modal y actualizar el balance
      setUiState(prev => ({ ...prev, showRechargeModal: false }));
      setRechargeAmount('');
      
      // 4. Actualizar el balance
      if (clientData?.mono_ledger_account_id) {
        const balanceResponse = await fetch(
          `/api/mono/v1/balance?account_id=${clientData.mono_ledger_account_id}&_t=${Date.now()}`,
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );

        const balanceData = await balanceResponse.json();
        if (balanceResponse.ok) {
          setBalance(Number(balanceData.available) / 100);
        }
      }

      // 5. Actualizar las transacciones
      fetchTransactions();

      // 6. Mostrar mensaje de éxito
      alert('¡Recarga exitosa!');

    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la recarga. Por favor intenta nuevamente.');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleFICWithdraw = async () => {
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      const response = await fetch('/api/mono/v1/recharges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          userId: clientData?.id,
          accountId: clientData?.mono_ledger_account_id,
          description: 'Retiro FIC Accival Vista'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el retiro');
      }

      // Actualizar el balance
      if (clientData?.mono_ledger_account_id) {
        const balanceResponse = await fetch(
          `/api/mono/v1/balance?account_id=${clientData.mono_ledger_account_id}&_t=${Date.now()}`
        );
        const balanceData = await balanceResponse.json();
        if (balanceResponse.ok) {
          setBalance(Number(balanceData.available) / 100);
        }
      }

      // Cerrar modal y limpiar
      setUiState(prev => ({ ...prev, showFICWithdrawModal: false }));
      setWithdrawAmount('');
      
      // Actualizar transacciones
      fetchTransactions();

      alert('¡Retiro exitoso!');
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al procesar el retiro. Por favor intenta nuevamente.');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleInvestment = async () => {
    try {
      // Validar que selectedInvestment no sea null
      if (!selectedInvestment) {
        throw new Error('No se ha seleccionado ninguna inversión');
      }

      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      const response = await fetch('/api/mono/v1/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(investmentAmount),
          userId: clientData?.id,
          accountId: clientData?.mono_ledger_account_id,
          description: `Inversión en ${selectedInvestment?.name || 'producto financiero'}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la inversión');
      }

      // Actualizar balance
      if (clientData?.mono_ledger_account_id) {
        const balanceResponse = await fetch(
          `/api/mono/v1/balance?account_id=${clientData.mono_ledger_account_id}&_t=${Date.now()}`
        );
        const balanceData = await balanceResponse.json();
        if (balanceResponse.ok) {
          setBalance(Number(balanceData.available) / 100);
        }
      }

      // Actualizar transacciones
      fetchTransactions();

      // Limpiar y cerrar modal
      setInvestmentAmount('');
      setSelectedInvestment(null);
      
      alert('¡Inversión exitosa!');
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al procesar la inversión. Por favor intenta nuevamente.');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (uiState.loading) {
    return (
      <div className="min-h-screen bg-mpf-beige flex items-center justify-center">
        <div className="text-mono-purple">Cargando...</div>
      </div>
    );
  }

  if (uiState.error) {
    return (
      <div className="min-h-screen bg-mpf-beige flex items-center justify-center">
        <div className="text-red-400">Error: {uiState.error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mpf-beige p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:items-start mb-6 sm:mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            {clientData?.company_logo_url ? (
              <div className="w-40 h-40 rounded-full overflow-hidden bg-mono-gray">
                <Image
                  src={clientData.company_logo_url}
                  alt="Logo de la empresa"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-40 h-40 rounded-full bg-mono-gray flex items-center justify-center">
                <span className="text-5xl text-white">
                  {clientData?.company_name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-mpf-dark mb-2">
                {clientData?.company_name}
              </h1>
              <p className="text-base sm:text-lg font-semibold text-mpf-teal/80">
                {clientData?.first_name} {clientData?.last_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto px-4 py-2 text-mpf-teal hover:text-mpf-teal/80 font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Mostrar el saldo */}
        <div className="p-6 sm:p-8 bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-100/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base text-gray-500 font-medium">Saldo Disponible</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setUiState(prev => ({ ...prev, showTransferModal: true }))}
                className="px-5 py-2.5 bg-white hover:bg-gray-50 text-mpf-dark border border-gray-200 font-medium rounded-xl transition-all text-sm flex items-center gap-2"
              >
                <span className="text-lg">↗</span>
                <span>Transferir</span>
              </button>
              <button
                onClick={() => setUiState(prev => ({ ...prev, showRechargeModal: true }))}
                className="px-5 py-2.5 bg-mpf-teal hover:bg-mpf-teal/90 text-white font-medium rounded-xl transition-all text-sm flex items-center gap-2 shadow-sm"
              >
                <span>↓</span>
                <span>Recargar</span>
              </button>
            </div>
          </div>
          <p className="text-4xl sm:text-5xl font-bold text-mpf-dark tracking-tight">
            ${(balance || 0).toLocaleString('es-CO')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
          {/* Columna Principal - ajustar para que ocupe todo el alto */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 h-full flex flex-col">
            {/* Sección de Movimientos - hacer que se expanda */}
            <div className="flex-1 h-full">
              <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-100/20 h-full">
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-mpf-dark">Últimos Movimientos</h2>
                  </div>
                  <div className="space-y-2 flex-1">
                    {uiState.transactionsLoading ? (
                      <div className="text-center py-8 text-gray-500">Cargando movimientos...</div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay movimientos para mostrar</div>
                    ) : (
                      transactions.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-4 sm:p-5 bg-mpf-warmGray hover:bg-white/60 rounded-xl transition-all border border-gray-100/20">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.operation_type === 'credit' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <span className="text-lg">{transaction.operation_type === 'credit' ? '↑' : '↓'}</span>
                            </div>
                            <div>
                              <p className="text-mpf-dark font-medium">
                                {transaction.description || 'Descripción no disponible'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.transaction_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <p className={`font-semibold ${
                            transaction.operation_type === 'credit' 
                              ? 'text-emerald-600' 
                              : 'text-red-600'
                          }`}>
                            ${(transaction.amount.amount / 100).toLocaleString('es-CO')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Lateral - mantener su altura natural */}
          <div className="space-y-4 sm:space-y-6">
            {/* Sección de Tarjetas */}
            <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-mpf-dark">Tarjetas</h2>
                <button
                  onClick={() => {
                    if (!clientData?.birth_date) {
                      setUiState(prev => ({ ...prev, showBirthDateModal: true }));
                    } else {
                      setUiState(prev => ({ ...prev, showNicknameModal: true }));
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-gray-50 text-mpf-dark border border-gray-200 rounded-xl transition-all text-sm"
                >
                  Crear Tarjeta
                </button>
              </div>
              
              {cards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    No tienes tarjetas activas
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                    <div className="flex gap-3 sm:gap-4 pb-4">
                      {cards.map((card) => (
                        <div 
                          key={card.id}
                          className="flex-none w-[280px] sm:w-[300px] snap-center"
                        >
                          <div className="bg-gradient-to-r from-mpf-teal to-[#004544] rounded-xl p-6 aspect-[1.6/1] relative overflow-hidden transform transition-all duration-300 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
                            
                            <div className="flex justify-between items-start mb-8">
                              <div className="w-12 h-8 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-md"></div>
                              <Image 
                                src={card.card_art_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3uAjU_SrHLug3x9S3K2CmHs1HxtWGlTQYaA&s"} 
                                alt="Card" 
                                width={300} 
                                height={200} 
                                className="w-14 h-10 object-contain"
                              />
                            </div>
                            <div className="space-y-2 relative z-10">
                              <p className="text-white/70 text-sm font-medium">{card.nickname}</p>
                              <p className="text-white text-lg font-medium tracking-wider">
                                **** **** **** {card.last_four}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nueva sección de Otros Productos Financieros */}
            <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-100/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-mpf-dark">Otros Productos</h2>
              </div>
              
              {/* FIC Accival Vista */}
              <div className="space-y-4">
                <div className="p-4 bg-mpf-warmGray rounded-xl border border-gray-200/50 hover:bg-white/60 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-mpf-dark">FIC Accival Vista</h3>
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Fondo</span>
                  </div>
                  <p className="text-2xl font-bold text-mpf-dark mb-1">
                    ${(25_474_100).toLocaleString('es-CO')}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Disponible para retiro inmediato</p>
                    <button
                      onClick={() => setUiState(prev => ({ ...prev, showFICWithdrawModal: true }))}
                      className="px-4 py-2 bg-white hover:bg-gray-50 text-mpf-dark border border-gray-200 text-sm rounded-xl transition-all"
                    >
                      Retirar
                    </button>
                  </div>
                </div>

                {/* CDT Skandia */}
                <div className="p-4 bg-mpf-warmGray rounded-xl border border-gray-200/50 hover:bg-white/60 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-mpf-dark">CDT Skandia</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">CDT</span>
                  </div>
                  <p className="text-2xl font-bold text-mpf-dark mb-1">
                    ${(7_000_000).toLocaleString('es-CO')}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Plazo: 6 meses</span>
                      <span className="ml-4">Rentabilidad: 11.5%</span>
                    </div>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-200 text-gray-400 text-sm rounded-xl cursor-not-allowed"
                      title="No disponible hasta cumplir el plazo"
                    >
                      Retirar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Agregar después del módulo de Otros Productos */}
            <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-100/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-mpf-dark">Oportunidades de Inversión</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* FIC Renta Alta Davivienda */}
                <div 
                  onClick={() => setSelectedInvestment({
                    name: 'FIC Renta Alta Davivienda',
                    type: 'Fondo',
                    return: '12.8%',
                    minAmount: 200000,
                    description: 'Fondo de inversión colectiva con perfil moderado, ideal para inversiones a mediano plazo.',
                    risk: 'Moderado',
                    term: 'Retiro disponible en 3 días hábiles'
                  })}
                  className="p-4 bg-mpf-warmGray rounded-xl border border-gray-200/50 hover:bg-white/60 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-mpf-dark">FIC Renta Alta</h3>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">12.8%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Davivienda</p>
                </div>

                {/* CDT Digital Bancolombia */}
                <div 
                  onClick={() => setSelectedInvestment({
                    name: 'CDT Digital Bancolombia',
                    type: 'CDT',
                    return: '11.2%',
                    minAmount: 1000000,
                    description: 'Certificado de depósito a término con tasa fija garantizada.',
                    term: '12 meses',
                    risk: 'Bajo'
                  })}
                  className="p-4 bg-mpf-warmGray rounded-xl border border-gray-200/50 hover:bg-white/60 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-mpf-dark">CDT Digital</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">11.2%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Bancolombia</p>
                </div>

                {/* FIC Sumar */}
                <div 
                  onClick={() => setSelectedInvestment({
                    name: 'FIC Sumar Fiduciaria Bogotá',
                    type: 'Fondo',
                    return: '10.5%',
                    minAmount: 500000,
                    description: 'Fondo de inversión colectiva con perfil conservador y liquidez diaria.',
                    risk: 'Bajo',
                    term: 'Disponibilidad diaria'
                  })}
                  className="p-4 bg-mpf-warmGray rounded-xl border border-gray-200/50 hover:bg-white/60 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-mpf-dark">FIC Sumar</h3>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">10.5%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Fiduciaria Bogotá</p>
                </div>

                {/* Fondo Indexado */}
                <div 
                  onClick={() => setSelectedInvestment({
                    name: 'Fondo Indexado Colcap',
                    type: 'Acciones',
                    return: '15.3%',
                    minAmount: 1000000,
                    description: 'Fondo que replica el comportamiento del índice Colcap de la Bolsa de Valores de Colombia.',
                    risk: 'Alto',
                    term: 'Recomendado más de 3 años'
                  })}
                  className="p-4 bg-mpf-warmGray rounded-xl border border-gray-200/50 hover:bg-white/60 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-mpf-dark">Fondo Colcap</h3>
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">15.3%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Valores Bancolombia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {uiState.showBirthDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-xl border border-gray-100/20">
            <h3 className="text-xl font-semibold text-mpf-dark mb-2">
              Fecha de Nacimiento
            </h3>
            <p className="text-gray-600 mb-4">
              Para crear tu tarjeta, necesitamos tu fecha de nacimiento.
            </p>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setUiState(prev => ({ ...prev, showBirthDateModal: false }))}
                className="px-4 py-2 text-gray-400 hover:text-white"
                disabled={uiState.isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!birthDate) {
                    alert('Por favor ingresa tu fecha de nacimiento');
                    return;
                  }
                  setUiState(prev => ({ 
                    ...prev, 
                    showBirthDateModal: false,
                    showNicknameModal: true 
                  }));
                }}
                disabled={!birthDate || uiState.isSubmitting}
                className="px-6 py-2 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {uiState.showNicknameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-xl border border-gray-100/20">
            <h3 className="text-xl font-semibold text-mpf-dark mb-2">
              Nombre de la Tarjeta
            </h3>
            <p className="text-gray-600 mb-4">
              Asigna un nombre a tu nueva tarjeta para identificarla fácilmente.
            </p>
            <input
              type="text"
              value={cardNickname}
              onChange={(e) => setCardNickname(e.target.value)}
              placeholder="Ej: Mi Tarjeta Personal"
              className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setUiState(prev => ({ ...prev, showNicknameModal: false }));
                  setCardNickname('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
                disabled={uiState.isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCard}
                disabled={!cardNickname.trim() || uiState.isSubmitting}
                className="px-6 py-2 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {uiState.isSubmitting ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
      {uiState.showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-mpf-dark">Nueva Transferencia</h3>
              <button
                onClick={() => setUiState(prev => ({ ...prev, showTransferModal: false }))}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <TransferSection 
              banks={banks} 
              onTransfer={async (data) => {
                await handleTransfer(data);
                setUiState(prev => ({ ...prev, showTransferModal: false }));
              }}
            />
          </div>
        </div>
      )}
      {uiState.showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-xl border border-gray-100/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-mpf-dark">Nueva Recarga</h3>
              <button
                onClick={() => {
                  setUiState(prev => ({ ...prev, showRechargeModal: false }));
                  setRechargeAmount('');
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Input de monto */}
              <div>
                <label className="block text-gray-400 mb-2">Monto a Recargar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 pl-8 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
                  />
                </div>
              </div>

              {/* Montos predefinidos */}
              <div>
                <label className="block text-gray-400 mb-2">Montos Sugeridos</label>
                <div className="grid grid-cols-3 gap-2">
                  {predefinedAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setRechargeAmount(amount.toString())}
                      className="px-4 py-2 bg-gray-50 text-mpf-dark border border-gray-200 rounded-xl hover:bg-gray-100 transition-all font-medium"
                    >
                      ${amount.toLocaleString('es-CO')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handlePSERecharge}
                  disabled={!rechargeAmount || Number(rechargeAmount) <= 0 || uiState.isSubmitting}
                  className="w-full px-4 py-3 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uiState.isSubmitting ? 'Procesando...' : 'Continuar con PSE'}
                </button>
                <button
                  onClick={() => {
                    setUiState(prev => ({ ...prev, showRechargeModal: false }));
                    setRechargeAmount('');
                  }}
                  className="w-full px-4 py-3 text-gray-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {uiState.showFICWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-xl border border-gray-100/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-mpf-dark">Retiro FIC Accival Vista</h3>
              <button
                onClick={() => {
                  setUiState(prev => ({ ...prev, showFICWithdrawModal: false }));
                  setWithdrawAmount('');
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-400 mb-2">Monto a Retirar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    max={25474100}
                    className="w-full px-4 py-3 pl-8 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Máximo disponible: ${(25_474_100).toLocaleString('es-CO')}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleFICWithdraw}
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > 25474100 || uiState.isSubmitting}
                  className="w-full px-4 py-3 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uiState.isSubmitting ? 'Procesando...' : 'Confirmar Retiro'}
                </button>
                <button
                  onClick={() => {
                    setUiState(prev => ({ ...prev, showFICWithdrawModal: false }));
                    setWithdrawAmount('');
                  }}
                  className="w-full px-4 py-3 text-gray-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedInvestment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-xl border border-gray-100/20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-mpf-dark mb-1">{selectedInvestment.name}</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">{selectedInvestment.type}</span>
              </div>
              <button
                onClick={() => setSelectedInvestment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-mpf-warmGray rounded-xl">
                <p className="text-sm text-gray-500">Rentabilidad</p>
                <p className="text-2xl font-bold text-emerald-600">{selectedInvestment.return}</p>
              </div>

              <div className="space-y-3">
                <p className="text-gray-600">{selectedInvestment.description}</p>
                
                <div>
                  <label className="block text-gray-400 mb-2">Monto a Invertir</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="0"
                      min={selectedInvestment.minAmount}
                      className="w-full px-4 py-3 pl-8 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Mínimo: ${selectedInvestment.minAmount.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              <button
                className="w-full px-4 py-3 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all font-medium disabled:opacity-50"
                onClick={handleInvestment}
                disabled={!investmentAmount || Number(investmentAmount) < selectedInvestment.minAmount || uiState.isSubmitting}
              >
                {uiState.isSubmitting ? 'Procesando...' : 'Confirmar Inversión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 