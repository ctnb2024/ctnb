
export interface LeadData {
  nome_completo: string;
  empresa: string;
  email: string;
  telefone: string;
  revendedor: 'JF' | 'Nogueira' | '';
  documento: File | null;
  aceite_privacidade: boolean;
}

export interface FormErrors {
  nome_completo?: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  revendedor?: string;
  documento?: string;
  aceite_privacidade?: string;
}

export enum FormStatus {
  IDLE = 'IDLE',
  REVIEW = 'REVIEW',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface IntegrationResponse {
  success: boolean;
  message: string;
  integrationId?: string;
}
