ALTER TABLE wallet_mono_ix_clients
ADD COLUMN document_number TEXT NOT NULL DEFAULT 'PENDIENTE';

-- Opcional: remover el valor por defecto después de la migración
ALTER TABLE wallet_mono_ix_clients
ALTER COLUMN document_number DROP DEFAULT; 