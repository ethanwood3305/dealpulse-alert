
export interface UserSubscription {
  plan: string;
  urls_limit: number;
  stripe_subscription_id: string | null;
  has_api_access: boolean;
  api_key: string | null;
  trial_end: string | null;
}
