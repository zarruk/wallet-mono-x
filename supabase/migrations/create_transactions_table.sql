CREATE TABLE wallet_mono_ix_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    mono_ledger_account_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    operation TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success' o 'failed'
    external_id UUID NOT NULL
);

-- Crear índices
CREATE INDEX idx_transactions_mono_ledger_account_id ON wallet_mono_ix_transactions(mono_ledger_account_id);
CREATE INDEX idx_transactions_external_id ON wallet_mono_ix_transactions(external_id); 