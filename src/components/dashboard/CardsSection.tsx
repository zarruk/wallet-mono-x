import { motion } from 'framer-motion';
import Image from 'next/image';

interface MonoCard {
  id: string;
  state: string;
  nickname: string;
  account_id: string;
  last_four: string;
  configuration_group_id: string;
  cardholder_id: string;
  card_art_url?: string;
}

interface CardsSectionProps {
  cards: MonoCard[];
  onCreateCard: () => void;
  isLoading: boolean;
  clientData?: {
    birth_date?: string;
  };
}

const CardsSection = ({ cards, onCreateCard, isLoading, clientData }: CardsSectionProps) => {
  if (isLoading) {
    return (
      <div className="bg-mono-gray rounded-2xl p-4 sm:p-6">
        <div className="text-center text-gray-400">Cargando tarjetas...</div>
      </div>
    );
  }

  return (
    <div className="bg-mono-gray rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white">Tarjetas</h2>
        <button
          onClick={onCreateCard}
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
                        className="w-full h-full object-cover"
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
  );
};

export default CardsSection; 