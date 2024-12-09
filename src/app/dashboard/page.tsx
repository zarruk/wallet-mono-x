'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { motion, useAnimation, PanInfo } from 'framer-motion';

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
  pagination: {
    page_size: number;
    page_number: number;
    total_pages: number;
    total_items: number;
  };
}

interface MonoCard {
  id: string;
  state: string;
  nickname: string;
  account_id: string;
  last_four: string;
  configuration_group_id: string;
  cardholder_id: string;
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

export default function DashboardPage() {
  const router = useRouter();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cards, setCards] = useState<MonoCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [showBirthDateModal, setShowBirthDateModal] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const controls = useAnimation();
  const [dragStartX, setDragStartX] = useState(0);

  const fetchUserCards = async () => {
    try {
      console.log('Fetching user cards from Supabase...');
      const { data: dbCards, error } = await supabase
        .from('wallet_mono_ix_cards')
        .select('*')
        .eq('user_id', clientData!.id);

      if (error) throw error;

      console.log('Supabase cards:', dbCards);

      if (dbCards && dbCards.length > 0) {
        console.log('Found cards in Supabase, fetching from Mono...');
        const monoCards = await Promise.all(
          dbCards.map(async (card) => {
            const response = await fetch(`/api/mono/v1/cards/${card.card_id}`);
            const cardData = await response.json();
            return cardData;
          })
        );
        console.log('Mono cards:', monoCards);
        setCards(monoCards);
      } else {
        console.log('No cards found in Supabase');
        setCards([]);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      setCards([]);
    } finally {
      setCardsLoading(false);
    }
  };

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
  const handleCreateCardholder = async () => {
    try {
      setIsSubmitting(true);
      
      // Si ya existe birth_date en clientData, usarlo
      const birthDateToUse = clientData?.birth_date || birthDate;
      
      const response = await fetch('/api/mono/v1/cards/cardholders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: clientData,
          birthDate: birthDateToUse
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el cardholder');
      }

      // Guardar en Supabase y actualizar el estado
      await saveCardToDatabase(data.cardData);
      setCards(prevCards => [...prevCards, data.cardData]);
      setShowBirthDateModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la tarjeta. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
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

  // Primer useEffect para obtener datos del cliente
  useEffect(() => {
    const checkAuth = async () => {
      const userEmail = localStorage.getItem('userEmail');
      
      if (!userEmail) {
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
          .eq('email', userEmail)
          .single();

        if (error) throw error;
        setClientData(data);

        // Obtener el balance de Mono con un timestamp para evitar caché
        if (data.mono_ledger_account_id) {
          console.log('Fetching fresh balance...');
          const timestamp = new Date().getTime();
          const balanceResponse = await fetch(
            `/api/mono/v1/ledger/accounts/${data.mono_ledger_account_id}/balances?_t=${timestamp}`,
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

          setBalance(balanceData.available.amount / 100);
        }

        const fetchTransactions = async () => {
          try {
            console.log('Fetching transactions...');
            console.log('Account ID:', data.mono_ledger_account_id);
            console.log('Current Page:', currentPage);
            
            const timestamp = new Date().getTime();
            const response = await fetch(
              `/api/mono/v1/ledger/accounts/${data.mono_ledger_account_id}/transactions?page=${currentPage}&_t=${timestamp}`,
              {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache'
                }
              }
            );

            console.log('Response status:', response.status);
            const transactionsData: TransactionsResponse = await response.json();
            console.log('Transactions data:', JSON.stringify(transactionsData, null, 2));

            if (!response.ok) {
              throw new Error(transactionsData.error || 'Error al obtener las transacciones');
            }

            setTransactions(transactionsData.transactions || []);
            setTotalPages(transactionsData.pagination?.total_pages || 1);
          } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
          } finally {
            setTransactionsLoading(false);
          }
        };

        if (data.mono_ledger_account_id) {
          fetchTransactions();
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Nuevo useEffect para obtener tarjetas cuando clientData esté disponible
  useEffect(() => {
    if (clientData?.id) {
      fetchUserCards();
    }
  }, [clientData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mono-dark flex items-center justify-center">
        <div className="text-mono-purple">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mono-dark flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
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
                <img
                  src={clientData.company_logo_url}
                  alt="Logo de la empresa"
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
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Saldo Disponible</h2>
          <p className="text-2xl sm:text-3xl font-bold text-mono-purple">
            ${balance?.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Sección de Movimientos */}
            <div className="bg-mono-gray rounded-2xl p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Últimos Movimientos</h2>
              <div className="space-y-3 sm:space-y-4">
                {transactionsLoading ? (
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
                    if (clientData?.birth_date) {
                      handleCreateCardholder();
                    } else {
                      setShowBirthDateModal(true);
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
                              <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3uAjU_SrHLug3x9S3K2CmHs1HxtWGlTQYaA&s"
                                alt="Visa Logo"
                                className="w-12 h-8 object-contain"
                              />
                            </div>
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
      {showBirthDateModal && (
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
                onClick={() => setShowBirthDateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCardholder}
                disabled={!birthDate || isSubmitting}
                className="px-6 py-2 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Creando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 