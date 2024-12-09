-- Crear la tabla de clientes
CREATE TABLE wallet_mono_ix_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    initial_balance INTEGER NOT NULL,
    company_logo_url TEXT
);

-- Crear la tabla de usuarios
CREATE TABLE wallet_mono_ix_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    CONSTRAINT fk_client_email
        FOREIGN KEY (email)
        REFERENCES wallet_mono_ix_clients(email)
        ON DELETE CASCADE
);

-- Crear índices
CREATE INDEX idx_clients_email ON wallet_mono_ix_clients(email);
CREATE INDEX idx_users_email ON wallet_mono_ix_users(email);