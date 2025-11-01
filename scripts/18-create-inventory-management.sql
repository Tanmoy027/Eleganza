-- Inventory management schema: product variants, movements, views, and automation

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Product variants table for size/color level stock
DROP TABLE IF EXISTS product_variants CASCADE;
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  sku TEXT UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  restock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (restock_threshold >= 0),
  last_sold_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, color, size)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_last_sold ON product_variants(last_sold_at);

-- 2) Inventory movements table for audit trail
DROP TABLE IF EXISTS inventory_movements CASCADE;
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','adjustment','reservation','release','sale')),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);

-- 3) Helper: keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4) Aggregate refresh on product to sync stock_quantity, sizes, colors from variants
CREATE OR REPLACE FUNCTION refresh_product_aggregates(p_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_stock INTEGER;
  v_sizes TEXT[];
  v_colors TEXT[];
BEGIN
  SELECT COALESCE(SUM(stock_quantity),0) INTO v_total_stock
  FROM product_variants WHERE product_id = p_id AND is_active = TRUE;

  SELECT COALESCE(ARRAY(SELECT DISTINCT size FROM product_variants WHERE product_id = p_id AND size IS NOT NULL AND size <> '' AND is_active = TRUE ORDER BY size), ARRAY[]::TEXT[]) INTO v_sizes;
  SELECT COALESCE(ARRAY(SELECT DISTINCT color FROM product_variants WHERE product_id = p_id AND color IS NOT NULL AND color <> '' AND is_active = TRUE ORDER BY color), ARRAY[]::TEXT[]) INTO v_colors;

  UPDATE products
  SET stock_quantity = v_total_stock,
      sizes = v_sizes,
      colors = v_colors,
      updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger refresh on variant changes
CREATE OR REPLACE FUNCTION after_variant_change_refresh_product()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_product_aggregates(COALESCE(NEW.product_id, OLD.product_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variant_after_ins ON product_variants;
CREATE TRIGGER trg_variant_after_ins
AFTER INSERT ON product_variants
FOR EACH ROW EXECUTE FUNCTION after_variant_change_refresh_product();

DROP TRIGGER IF EXISTS trg_variant_after_upd ON product_variants;
CREATE TRIGGER trg_variant_after_upd
AFTER UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION after_variant_change_refresh_product();

DROP TRIGGER IF EXISTS trg_variant_after_del ON product_variants;
CREATE TRIGGER trg_variant_after_del
AFTER DELETE ON product_variants
FOR EACH ROW EXECUTE FUNCTION after_variant_change_refresh_product();

-- 5) Process inventory movement to adjust stock and audit
CREATE OR REPLACE FUNCTION process_inventory_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_pid UUID;
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    v_pid := (SELECT product_id FROM product_variants WHERE id = NEW.variant_id);
    IF v_pid IS NULL THEN
      v_pid := NEW.product_id;
    END IF;

    -- Apply changes to variant
    IF NEW.movement_type = 'in' THEN
      UPDATE product_variants SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.variant_id;
    ELSIF NEW.movement_type IN ('out','sale') THEN
      UPDATE product_variants SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0),
                                  last_sold_at = CASE WHEN NEW.movement_type = 'sale' THEN NOW() ELSE last_sold_at END
      WHERE id = NEW.variant_id;
    ELSIF NEW.movement_type = 'adjustment' THEN
      UPDATE product_variants SET stock_quantity = GREATEST(stock_quantity + NEW.quantity, 0) WHERE id = NEW.variant_id;
    ELSIF NEW.movement_type = 'reservation' THEN
      UPDATE product_variants SET reserved_quantity = reserved_quantity + NEW.quantity WHERE id = NEW.variant_id;
    ELSIF NEW.movement_type = 'release' THEN
      UPDATE product_variants SET reserved_quantity = GREATEST(reserved_quantity - NEW.quantity, 0) WHERE id = NEW.variant_id;
    END IF;

    -- Refresh product aggregates
    PERFORM refresh_product_aggregates(v_pid);
  ELSE
    -- No variant provided, best-effort: adjust product stock only
    IF NEW.movement_type = 'in' THEN
      UPDATE products SET stock_quantity = GREATEST(stock_quantity + NEW.quantity, 0) WHERE id = NEW.product_id;
    ELSIF NEW.movement_type IN ('out','sale','adjustment') THEN
      UPDATE products SET stock_quantity = GREATEST(stock_quantity + NEW.quantity, 0) WHERE id = NEW.product_id; -- adjustment can be +/-
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_movement_after_ins ON inventory_movements;
CREATE TRIGGER trg_inventory_movement_after_ins
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION process_inventory_movement();

-- 6) Auto record sale movement on order_items insert
CREATE OR REPLACE FUNCTION after_order_item_insert_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_variant_id UUID;
BEGIN
  -- Find variant by product + size + color (case-insensitive)
  SELECT id INTO v_variant_id FROM product_variants
  WHERE product_id = NEW.product_id
    AND ( (NEW.size IS NULL AND size IS NULL) OR COALESCE(UPPER(size),'') = COALESCE(UPPER(NEW.size),'') )
    AND ( (NEW.color IS NULL AND color IS NULL) OR COALESCE(LOWER(color),'') = COALESCE(LOWER(NEW.color),'') )
  LIMIT 1;

  IF v_variant_id IS NOT NULL THEN
    INSERT INTO inventory_movements (product_id, variant_id, quantity, movement_type, reason, metadata)
    VALUES (NEW.product_id, v_variant_id, NEW.quantity, 'sale', 'Order placed', jsonb_build_object('order_id', NEW.order_id, 'order_item_id', NEW.id));
  ELSE
    -- Fallback: reduce product stock if no variant found
    UPDATE products SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0) WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_items_after_ins ON order_items;
CREATE TRIGGER trg_order_items_after_ins
AFTER INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION after_order_item_insert_inventory();

-- 7) Views for admin
CREATE OR REPLACE VIEW inventory_status AS
SELECT pv.id as variant_id,
       pv.product_id,
       p.name as product_name,
       pv.color,
       pv.size,
       pv.stock_quantity,
       pv.reserved_quantity,
       pv.restock_threshold,
       (pv.stock_quantity <= pv.restock_threshold) AS needs_restock,
       pv.last_sold_at,
       p.is_active as product_active,
       p.is_on_discount,
       p.discount_percentage
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE pv.is_active = TRUE AND p.is_active = TRUE;

-- 8) Function to discount stale inventory
CREATE OR REPLACE FUNCTION apply_stale_inventory_discounts(
  default_percentage INTEGER DEFAULT 15,
  days_without_sale INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE products p
  SET discount_percentage = GREATEST(COALESCE(p.discount_percentage, 0), default_percentage),
      is_on_discount = TRUE,
      updated_at = NOW()
  WHERE p.is_active = TRUE
    AND p.id IN (
      SELECT pv.product_id
      FROM product_variants pv
      WHERE pv.is_active = TRUE
      GROUP BY pv.product_id
      HAVING COALESCE(MAX(pv.last_sold_at), TO_TIMESTAMP(0)) < NOW() - (INTERVAL '1 day' * days_without_sale)
         AND SUM(pv.stock_quantity) > 0
    )
    AND (p.is_on_discount = FALSE OR p.is_on_discount IS NULL);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION apply_stale_inventory_discounts IS 'Marks products with no sales in the given period as discounted by default_percentage';

-- 9) RLS policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- product_variants: public can read active variants of active products
DROP POLICY IF EXISTS "Public can read active variants" ON product_variants;
CREATE POLICY "Public can read active variants" ON product_variants
  FOR SELECT USING (
    is_active = TRUE AND EXISTS (
      SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND p.is_active = TRUE
    )
  );

-- product_variants: admin full access
DROP POLICY IF EXISTS "Admins manage variants" ON product_variants;
CREATE POLICY "Admins manage variants" ON product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- inventory_movements: admin read/write only
DROP POLICY IF EXISTS "Admins read movements" ON inventory_movements;
CREATE POLICY "Admins read movements" ON inventory_movements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins write movements" ON inventory_movements;
CREATE POLICY "Admins write movements" ON inventory_movements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- inventory_movements: allow users to insert 'sale' movements for their own orders (via trigger)
DROP POLICY IF EXISTS "Users insert sale movements for own order" ON inventory_movements;
CREATE POLICY "Users insert sale movements for own order" ON inventory_movements
  FOR INSERT WITH CHECK (
    movement_type = 'sale'
    AND metadata ? 'order_id'
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = (inventory_movements.metadata->>'order_id')::uuid
        AND o.user_id = auth.uid()
    )
  );

-- Helpful index on view predicate fields already added via base tables

COMMIT;
