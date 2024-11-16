// Types and interfaces
export interface User {
  nillion_user_id: string;
}

export interface StoreResult {
  store_id: string;
  secret_name: string;
  app_id: string;
}

export interface StoreIdResponse {
  store_ids: Array<{
    store_id: string;
    secret_name: string;
  }>;
}

export interface Secret {
  secret_value: string | number;
  nillion_user_id: string;
}

export interface SecretPayload {
  secret: {
    nillion_seed: string;
    secret_value: string | number;
    secret_name: string;
  };
  permissions: {
    retrieve: string[];
    update: string[];
    delete: string[];
    compute: Record<string, unknown>;
  };
}

export interface UpdateSecretPayload {
  nillion_seed: string;
  secret_value: string | number;
  secret_name: string;
}

export interface NillionConfig {
  appId: string;
  userSeed: string;
  apiBase: string;
}
