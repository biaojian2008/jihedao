-- 济和币转账函数（在 Supabase Dashboard → SQL Editor 中执行此文件内容）
-- 执行后，转账 API 才能正常扣款、加款并写入流水

create or replace function public.transfer_jihe_coin(p_from_id uuid, p_to_id uuid, p_amount numeric)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_balance numeric;
  v_transfer_id text;
begin
  if p_from_id = p_to_id then
    return json_build_object('ok', false, 'error', 'cannot transfer to self');
  end if;
  if p_amount is null or p_amount <= 0 then
    return json_build_object('ok', false, 'error', 'invalid amount');
  end if;
  select jihe_coin_balance into v_from_balance from public.user_profiles where id = p_from_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'sender not found');
  end if;
  if v_from_balance < p_amount then
    return json_build_object('ok', false, 'error', 'insufficient balance');
  end if;
  if not exists (select 1 from public.user_profiles where id = p_to_id) then
    return json_build_object('ok', false, 'error', 'recipient not found');
  end if;
  v_transfer_id := gen_random_uuid()::text;
  update public.user_profiles set jihe_coin_balance = jihe_coin_balance - p_amount, updated_at = now() where id = p_from_id;
  update public.user_profiles set jihe_coin_balance = jihe_coin_balance + p_amount, updated_at = now() where id = p_to_id;
  insert into public.jihe_coin_ledger (user_id, amount, reason, reference_type, reference_id) values
    (p_from_id, -p_amount, 'transfer_out', 'transfer', v_transfer_id),
    (p_to_id, p_amount, 'transfer_in', 'transfer', v_transfer_id);
  return json_build_object('ok', true, 'transfer_id', v_transfer_id);
end;
$$;
