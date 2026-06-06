-- Script de Persistencia SQL (SQLite / PostgreSQL)
-- Define la estructura para pedidos y sus imágenes de referencia asociadas

-- Tabla principal de pedidos (soporta catálogo y personalizados)
CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(50) PRIMARY KEY,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_email VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(50),
    tipo_producto VARCHAR(100) NOT NULL,
    material VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    descripcion_diseno TEXT NOT NULL,
    modalidad_entrega VARCHAR(20) NOT NULL DEFAULT 'pickup', -- 'pickup' (Retiro local) / 'delivery' (Envío)
    direccion_entrega TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'pending_quotation', -- 'pending_quotation', 'pending_deposit', etc.
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de imágenes asociadas a cada pedido (Relación 1 a N)
CREATE TABLE IF NOT EXISTS pedido_imagenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Para PostgreSQL usar: SERIAL PRIMARY KEY
    pedido_id VARCHAR(50) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
);
