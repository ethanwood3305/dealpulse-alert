
export interface UserSubscription {
  plan: string;
  urls_limit: number;
  has_api_access: boolean;
  api_key: string | null;
}
