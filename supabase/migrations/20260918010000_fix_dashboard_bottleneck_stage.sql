-- Keep dashboard bottleneck monitoring aligned with the active production stage.
-- The order-stage constraint no longer permits legacy `jahit` or `quality_control`.

CREATE OR REPLACE VIEW public.dashboard_metrics AS
SELECT
    COUNT(*) FILTER (WHERE stage <> 'pengiriman') AS total_active_orders,
    COUNT(*) FILTER (WHERE NOT pelunasan_verified) AS total_unpaid_orders,
    COALESCE(
        SUM(dp_desain_amount + dp_produksi_amount + pelunasan_amount)
            FILTER (WHERE NOT pelunasan_verified),
        0::numeric
    ) AS total_receivables,
    COUNT(*) FILTER (
        WHERE stage = 'cutting_jahit'
          AND stage_entered_at < NOW() - INTERVAL '3 days'
    ) AS bottleneck_count
FROM public.orders;

CREATE OR REPLACE VIEW public.bottleneck_orders AS
SELECT
    o.id,
    o.customer_id,
    o.total_quantity,
    o.order_description,
    o.mockup_url,
    o.deadline,
    o.stage,
    o.dp_desain_amount,
    o.dp_desain_verified,
    o.dp_desain_proof_url,
    o.dp_desain_verified_at,
    o.dp_desain_verified_by,
    o.dp_produksi_amount,
    o.dp_produksi_verified,
    o.dp_produksi_proof_url,
    o.dp_produksi_verified_at,
    o.dp_produksi_verified_by,
    o.pelunasan_amount,
    o.pelunasan_verified,
    o.pelunasan_proof_url,
    o.pelunasan_verified_at,
    o.pelunasan_verified_by,
    o.tracking_number,
    o.shipped_at,
    o.stage_entered_at,
    o.created_by,
    o.created_at,
    o.updated_at,
    c.name AS customer_name,
    c.phone AS customer_phone,
    EXTRACT(DAY FROM NOW() - o.stage_entered_at) AS days_in_stage
FROM public.orders AS o
JOIN public.customers AS c ON o.customer_id = c.id
WHERE o.stage = 'cutting_jahit'
  AND o.stage_entered_at < NOW() - INTERVAL '3 days';
