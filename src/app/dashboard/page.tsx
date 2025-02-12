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
  const predefinedAmounts = [50000, 100000, 200000];

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
    if (clientData?.mono_ledger_account_id) {
      fetchTransactions();
    }
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

  if (uiState.loading) {
    return (
      <div className="min-h-screen bg-mono-dark flex items-center justify-center">
        <div className="text-mono-purple">Cargando...</div>
      </div>
    );
  }

  if (uiState.error) {
    return (
      <div className="min-h-screen bg-mono-dark flex items-center justify-center">
        <div className="text-red-400">Error: {uiState.error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mono-dark p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:items-start mb-6 sm:mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            {clientData?.company_logo_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden bg-mono-gray">
                <Image
                  src={clientData.company_logo_url}
                  alt="Logo de la empresa"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-mono-gray flex items-center justify-center">
                <span className="text-2xl text-white">
                  {clientData?.company_name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {clientData?.company_name}
              </h1>
              <p className="text-sm sm:text-base text-gray-400">
                {clientData?.first_name} {clientData?.last_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-mono-purple transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Mostrar el saldo */}
        <div className="p-4 sm:p-6 bg-mono-gray rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Saldo Disponible</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setUiState(prev => ({ ...prev, showTransferModal: true }))}
                className="px-4 py-2 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all text-sm flex items-center gap-2"
              >
                <span>↗</span>
                <span>Transferir</span>
              </button>
              <button
                onClick={() => setUiState(prev => ({ ...prev, showRechargeModal: true }))}
                className="px-4 py-2 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all text-sm flex items-center gap-2"
              >
                <span>↓</span>
                <span>Recargar</span>
              </button>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-mono-purple">
            ${(balance || 0).toLocaleString('es-CO')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Sección de Movimientos */}
            <div className="bg-mono-gray rounded-2xl p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Últimos Movimientos</h2>
              <div className="space-y-3 sm:space-y-4">
                {uiState.transactionsLoading ? (
                  <div className="text-center text-gray-400">Cargando movimientos...</div>
                ) : !transactions ? (
                  <div className="text-center text-gray-400">Error al cargar movimientos</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center text-gray-400">No hay movimientos disponibles</div>
                ) : (
                  <>
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 sm:p-4 bg-mono-dark/50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full ${
                            transaction.operation_type === 'credit' 
                              ? 'bg-green-500/20' 
                              : 'bg-red-500/20'
                          } flex items-center justify-center`}>
                            <span className={
                              transaction.operation_type === 'credit' 
                                ? 'text-green-500' 
                                : 'text-red-500'
                            }>
                              {transaction.operation_type === 'credit' ? '↑' : '↓'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white">
                              {transaction.description || 'Descripción no disponible'}
                            </p>
                            <p className="text-sm text-gray-400">
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
                        <p className={`font-medium ${
                          transaction.operation_type === 'credit' 
                            ? 'text-green-500' 
                            : 'text-red-400'
                        }`}>
                          ${(transaction.amount.amount / 100).toLocaleString('es-CO')}
                        </p>
                      </div>
                    ))}

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-4 mt-6">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 text-sm text-gray-400 hover:text-mono-purple disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <span className="text-gray-400">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 text-sm text-gray-400 hover:text-mono-purple disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Columna Lateral */}
          <div className="space-y-4 sm:space-y-6">
            {/* Sección de Tarjetas */}
            <div className="bg-mono-gray rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Tarjetas</h2>
                <button
                  onClick={() => {
                    if (!clientData?.birth_date) {
                      setUiState(prev => ({ ...prev, showBirthDateModal: true }));
                    } else {
                      setUiState(prev => ({ ...prev, showNicknameModal: true }));
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all text-sm"
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
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 aspect-[1.6/1] relative overflow-hidden transform transition-all duration-300 hover:scale-105">
                            <div className="flex justify-between items-start mb-8">
                              <div className="w-10 h-6 bg-yellow-400/90 rounded"></div>
                              <Image 
                                src={card.card_art_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3uAjU_SrHLug3x9S3K2CmHs1HxtWGlTQYaA&s"} 
                                alt="Card" 
                                width={300} 
                                height={200} 
                                className="w-12 h-8 object-contain"
                                />                            </div>
                            <div className="space-y-2">
                              <p className="text-white/60 text-sm">{card.nickname}</p>
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
          </div>
        </div>
      </div>
      {uiState.showBirthDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-mono-gray p-4 sm:p-6 rounded-2xl w-full max-w-[90%] sm:max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              Fecha de Nacimiento
            </h3>
            <p className="text-gray-400 mb-4">
              Para crear tu tarjeta, necesitamos tu fecha de nacimiento.
            </p>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white mb-4"
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
                className="px-6 py-2 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {uiState.showNicknameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-mono-gray p-4 sm:p-6 rounded-2xl w-full max-w-[90%] sm:max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              Nombre de la Tarjeta
            </h3>
            <p className="text-gray-400 mb-4">
              Asigna un nombre a tu nueva tarjeta para identificarla fácilmente.
            </p>
            <input
              type="text"
              value={cardNickname}
              onChange={(e) => setCardNickname(e.target.value)}
              placeholder="Ej: Mi Tarjeta Personal"
              className="w-full px-4 py-3 bg-mono-dark border-0 rounded-xl text-white mb-4"
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
                className="px-6 py-2 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {uiState.isSubmitting ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
      {uiState.showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-mono-gray p-4 sm:p-6 rounded-2xl w-full max-w-[90%] sm:max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Nueva Transferencia</h3>
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
          <div className="bg-mono-gray p-6 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Nueva Recarga</h3>
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
                    className="w-full px-4 py-3 pl-8 bg-mono-dark border-0 rounded-xl text-white"
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
                      className="px-4 py-2 bg-mono-dark text-white rounded-xl hover:bg-opacity-80 transition-all"
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
                  className="w-full px-4 py-3 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default Dashboard; 