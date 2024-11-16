import {
  NillionConfig,
  User,
  StoreResult,
  StoreIdResponse,
  Secret,
  SecretPayload,
  UpdateSecretPayload,
} from "../types/NillionTypes";

export class NillionClient {
  private config: NillionConfig;

  constructor(config: NillionConfig) {
    this.config = config;
  }

  // User Management
  async getUserId(): Promise<User> {
    console.log("Checking user ID generated by seed...");
    const user = await fetch(`${this.config.apiBase}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nillion_seed: this.config.userSeed,
      }),
    }).then((res) => res.json());
    return user;
  }

  // Secret Management
  async createSecret(
    secretValue: string | number,
    secretName: string,
  ): Promise<StoreResult> {
    console.log(`Creating secret: ${secretName}`);
    const payload: SecretPayload = {
      secret: {
        nillion_seed: this.config.userSeed,
        secret_value: secretValue,
        secret_name: secretName,
      },
      permissions: {
        retrieve: [],
        update: [],
        delete: [],
        compute: {},
      },
    };

    return await fetch(
      `${this.config.apiBase}/api/apps/${this.config.appId}/secrets`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    ).then((res) => res.json());
  }

  async updateSecret(
    storeId: string,
    secretName: string,
    newValue: string | number,
  ): Promise<StoreResult> {
    console.log(`Updating secret: ${secretName}`);
    const payload: UpdateSecretPayload = {
      nillion_seed: this.config.userSeed,
      secret_value: newValue,
      secret_name: secretName,
    };

    return await fetch(
      `${this.config.apiBase}/api/apps/${this.config.appId}/secrets/${storeId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    ).then((res) => res.json());
  }

  async getSecret(storeId: string, secretName: string): Promise<Secret> {
    console.log(`Retrieving secret: ${secretName}`);
    return await fetch(
      `${this.config.apiBase}/api/secret/retrieve/${storeId}?retrieve_as_nillion_user_seed=${this.config.userSeed}&secret_name=${secretName}`,
    ).then((res) => res.json());
  }

  async listStoreIds(): Promise<StoreIdResponse> {
    console.log("Listing store IDs...");
    return await fetch(
      `${this.config.apiBase}/api/apps/${this.config.appId}/store_ids`,
    ).then((res) => res.json());
  }
}
