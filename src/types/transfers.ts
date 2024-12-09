export interface Bank {
  code: string;
  id: string;
  name: string;
  supported_account_types: string[];
  supports_turbo: boolean;
}

export interface AccountType {
  label: string;
  value: string;
}

export interface DocumentType {
  label: string;
  value: string;
}

export const ACCOUNT_TYPES: AccountType[] = [
  { label: 'Cuenta de ahorros', value: 'savings_account' },
  { label: 'Cuenta corriente', value: 'checking_account' },
  { label: 'Depósito electrónico', value: 'electronic_deposit' }
];

export const DOCUMENT_TYPES: DocumentType[] = [
  { label: 'Cédula de ciudadanía', value: 'CC' },
  { label: 'Tarjeta de identidad', value: 'TI' },
  { label: 'NUIP', value: 'NUIP' },
  { label: 'Tarjeta de extranjería', value: 'TE' },
  { label: 'Cédula de extranjería', value: 'CE' },
  { label: 'NIT', value: 'NIT' },
  { label: 'Pasaporte', value: 'PASS' },
  { label: 'Permiso especial de permanencia', value: 'PEP' },
  { label: 'Permiso por protección temporal', value: 'PPT' },
  { label: 'Fideicomiso', value: 'FDO' },
  { label: 'Registro civil', value: 'RC' }
]; 