import "server-only";
// Disabled until payment scope, account eligibility and SDK configuration are verified.
export function directCheckoutEnabled(env:Record<string,string|undefined>=process.env){return env.CAKTO_DIRECT_CHECKOUT_ENABLED==="true"&&!!env.CAKTO_CLIENT_ID&&!!env.CAKTO_CLIENT_SECRET;}
