-- Agregar columna mono_account_id a la tabla de usuarios
ALTER TABLE wallet_mono_ix_users
ADD COLUMN mono_account_id TEXT;

-- Crear un índice para búsquedas rápidas por mono_account_id
CREATE INDEX idx_users_mono_account_id ON wallet_mono_ix_users(mono_account_id); 