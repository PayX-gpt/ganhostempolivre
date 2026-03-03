
-- Fix: The url_decode function was replacing + with space, which breaks [+30] in campaign names
-- Only decode %2B (which is encoded +), don't replace literal + signs
CREATE OR REPLACE FUNCTION public.url_decode(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text;
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  result := input;
  result := replace(result, '%5B', '[');
  result := replace(result, '%5D', ']');
  result := replace(result, '%2B', '+');
  result := replace(result, '%20', ' ');
  result := replace(result, '%2C', ',');
  result := replace(result, '%E2%80%94', '—');
  result := replace(result, '%C3%B3', 'ó');
  result := replace(result, '%C3%A9', 'é');
  result := replace(result, '%C3%A1', 'á');
  result := replace(result, '%C3%AD', 'í');
  result := replace(result, '%C3%BA', 'ú');
  result := replace(result, '%C3%A3', 'ã');
  result := replace(result, '%C3%B5', 'õ');
  result := trim(result);
  RETURN result;
END;
$$;
