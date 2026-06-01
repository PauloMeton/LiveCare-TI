-- Funcao de analytics pro admin dashboard (/admin/analytics)

create or replace function public.livecare_analytics(p_dias int default 30)
returns json
language sql
security invoker
set search_path = public
as $$
  with
  t_periodo as (
    select * from livecare_tickets
    where created_at >= now() - (p_dias || ' days')::interval and deleted_at is null
  ),
  por_status as (select status, count(*)::int as total from t_periodo group by status),
  por_classe as (select classe, count(*)::int as total from t_periodo group by classe),
  por_mes as (
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as mes,
           count(*)::int as total,
           count(*) filter (where status = 'concluido')::int as concluidos
    from livecare_tickets
    where created_at >= now() - interval '6 months' and deleted_at is null
    group by 1 order by 1
  ),
  top_unid as (
    select u.nome as unidade, count(*)::int as total
    from t_periodo t join unidades u on u.id = t.unidade_id
    group by u.nome order by total desc limit 5
  ),
  top_aut as (
    select coalesce(p.nome, '-') as nome, count(*)::int as total
    from t_periodo t left join profiles p on p.id = t.autor_id
    group by p.nome order by total desc limit 5
  ),
  resolvidos as (
    select extract(epoch from (concluido_em - created_at))/3600.0 as horas
    from t_periodo where status = 'concluido' and concluido_em is not null
  ),
  kpis as (
    select
      (select count(*)::int from t_periodo) as total,
      (select count(*)::int from t_periodo where status = 'aberto') as abertos,
      (select count(*)::int from t_periodo where status = 'andamento') as em_andamento,
      (select count(*)::int from t_periodo where status = 'concluido') as concluidos,
      (select count(*)::int from t_periodo where status = 'cancelado') as cancelados,
      (select count(*)::int from t_periodo where status = 'rejeitado') as rejeitados,
      (select round(avg(horas)::numeric, 1) from resolvidos) as tempo_medio_horas,
      (select round((count(*) filter (where horas <= 24))::numeric / nullif(count(*),0) * 100, 1)
         from resolvidos) as sla_24h_pct
  )
  select json_build_object(
    'periodo_dias', p_dias,
    'kpis',         (select to_jsonb(k) from kpis k),
    'por_status',   coalesce((select jsonb_agg(to_jsonb(x)) from por_status x), '[]'::jsonb),
    'por_classe',   coalesce((select jsonb_agg(to_jsonb(x)) from por_classe x), '[]'::jsonb),
    'por_mes',      coalesce((select jsonb_agg(to_jsonb(x)) from por_mes x), '[]'::jsonb),
    'top_unidades', coalesce((select jsonb_agg(to_jsonb(x)) from top_unid x), '[]'::jsonb),
    'top_autores',  coalesce((select jsonb_agg(to_jsonb(x)) from top_aut x), '[]'::jsonb)
  )::json;
$$;

grant execute on function public.livecare_analytics(int) to authenticated;
