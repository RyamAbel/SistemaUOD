import psycopg2

conn = psycopg2.connect('host=aws-1-us-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.xgwuxkvbdwxwflynanwo password=kkO7KX9i0f24epQy sslmode=require')
cur = conn.cursor()

sql = """
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documentos-activos', 'documentos-activos', true),
    ('documentos-comprobantes', 'documentos-comprobantes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acceso publico lectura facturas activos" ON storage.objects;
CREATE POLICY "Acceso publico lectura facturas activos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documentos-activos');

DROP POLICY IF EXISTS "Carga facturas activos autenticado" ON storage.objects;
CREATE POLICY "Carga facturas activos autenticado"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documentos-activos');

DROP POLICY IF EXISTS "Actualizar facturas activos autenticado" ON storage.objects;
CREATE POLICY "Actualizar facturas activos autenticado"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'documentos-activos');

DROP POLICY IF EXISTS "Eliminar facturas activos autenticado" ON storage.objects;
CREATE POLICY "Eliminar facturas activos autenticado"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'documentos-activos');
"""

cur.execute(sql)
conn.commit()

cur.execute("SELECT id, name, public FROM storage.buckets")
print("BUCKETS NOW:", cur.fetchall())
conn.close()
