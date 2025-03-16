
import Stripe from "https://esm.sh/stripe@14.9.0?target=deno";

// Initialize Stripe client
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

// Create custom Stripe product for subscription
export const createSubscriptionProduct = async (
  plan: string,
  urlCount: number,
  includeApiAccess: boolean
): Promise<Stripe.Product> => {
  const productName = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${urlCount} URLs)`;
  console.log(`Creating custom product: ${productName}`);
  
  const product = await stripe.products.create({
    name: productName,
    metadata: {
      plan: plan,
      url_count: urlCount.toString(),
      api_access: includeApiAccess ? 'yes' : 'no',
    },
  });
  
  console.log(`Created product: ${product.id}`);
  return product;
};

// Create custom Stripe price for product
export const createSubscriptionPrice = async (
  product: Stripe.Product,
  calculatedPrice: number,
  billingCycle: 'monthly' | 'yearly',
  plan: string,
  urlCount: number,
  includeApiAccess: boolean
): Promise<Stripe.Price> => {
  const priceData = {
    product: product.id,
    currency: 'usd',
    unit_amount: Math.round(calculatedPrice * 100), // Convert to cents
    recurring: {
      interval: billingCycle === 'yearly' ? 'year' : 'month',
    },
    metadata: {
      plan: plan,
      url_count: urlCount.toString(),
      api_access: includeApiAccess ? 'yes' : 'no',
      calculated_price: calculatedPrice.toString(),
    },
  };
  
  console.log(`Creating price: $${calculatedPrice} (${billingCycle})`);
  const price = await stripe.prices.create(priceData);
  console.log(`Created price: ${price.id}`);
  return price;
};

// Create Stripe customer
export const createCustomer = async (
  email: string,
  userId: string
): Promise<Stripe.Customer> => {
  console.log(`Creating Stripe customer for email: ${email} and user: ${userId}`);
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      user_id: userId,
    },
  });
  console.log(`Customer created: ${customer.id}`);
  return customer;
};

// Create Stripe checkout session
export const createCheckoutSession = async (
  params: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> => {
  console.log(`Creating checkout session with params: ${JSON.stringify(params).substring(0, 100)}...`);
  const session = await stripe.checkout.sessions.create(params);
  console.log(`Checkout session created: ${session.id}`);
  return session;
};
