
-- Mark all unsent welcome queue entries as "sent" to prevent flood on reconnect
UPDATE public.whatsapp_welcome_queue 
SET sent = true, 
    sent_at = now(), 
    lead_type = CASE WHEN purchased = true THEN 'post_purchase' ELSE 'cleared_backlog' END
WHERE sent = false;

-- Resolve all pending followups from the offline period
UPDATE public.whatsapp_pending_followups 
SET resolved = true, 
    resolved_at = now()
WHERE resolved = false;
