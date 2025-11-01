-- filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\scripts\\19-backfill-variants-from-products.sql
-- Create variants for existing products based on products.sizes/colors with equal stock split

DO $$
DECLARE
  r RECORD;
  s TEXT;
  c TEXT;
  per_variant INTEGER;
  combo_count INTEGER;
BEGIN
  FOR r IN SELECT id, stock_quantity, sizes, colors FROM products LOOP
    IF r.sizes IS NULL OR array_length(r.sizes,1) IS NULL THEN
      -- no sizes: create a single variant with total stock
      INSERT INTO product_variants(product_id, size, color, stock_quantity)
      VALUES (r.id, NULL, NULL, COALESCE(r.stock_quantity,0))
      ON CONFLICT (product_id, color, size) DO NOTHING;
    ELSE
      -- compute combos
      IF r.colors IS NULL OR array_length(r.colors,1) IS NULL THEN
        combo_count := array_length(r.sizes,1);
      ELSE
        combo_count := array_length(r.sizes,1) * array_length(r.colors,1);
      END IF;

      per_variant := CASE WHEN combo_count > 0 THEN GREATEST(FLOOR(COALESCE(r.stock_quantity,0)::NUMERIC / combo_count)::INT, 0) ELSE 0 END;

      IF r.colors IS NULL OR array_length(r.colors,1) IS NULL THEN
        FOREACH s IN ARRAY r.sizes LOOP
          INSERT INTO product_variants(product_id, size, color, stock_quantity)
          VALUES (r.id, s, NULL, per_variant)
          ON CONFLICT (product_id, color, size) DO NOTHING;
        END LOOP;
      ELSE
        FOREACH s IN ARRAY r.sizes LOOP
          FOREACH c IN ARRAY r.colors LOOP
            INSERT INTO product_variants(product_id, size, color, stock_quantity)
            VALUES (r.id, s, c, per_variant)
            ON CONFLICT (product_id, color, size) DO NOTHING;
          END LOOP;
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Refresh aggregates for all products
DO $$
DECLARE
  pid UUID;
BEGIN
  FOR pid IN SELECT id FROM products LOOP
    PERFORM refresh_product_aggregates(pid);
  END LOOP;
END $$;

COMMIT;
