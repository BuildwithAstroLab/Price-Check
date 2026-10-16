alter table public.user_estimates
  add column if not exists final_price numeric
  check (final_price is null or (final_price > 0 and final_price <= 100000000));
