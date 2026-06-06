import os
import sqlite3
import random
import string
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuración de límites y directorios
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATABASE_PATH = os.path.join(BASE_DIR, 'orders.db')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# RNF05/5MB: Límite estricto de Flask para el tamaño total del cuerpo de la petición (5 MB)
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Asegurar directorios requeridos
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Inicializar Base de Datos SQLite usando el schema.sql
def init_db():
    schema_path = os.path.join(BASE_DIR, 'schema.sql')
    if os.path.exists(schema_path):
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        conn = get_db_connection()
        conn.executescript(schema_sql)
        conn.close()
        print("Base de datos inicializada correctamente.")
    else:
        print("Error: schema.sql no encontrado.")

# Inicializar base de datos al arrancar
init_db()

@app.errorhandler(413)
def request_entity_too_large(error):
    # RNF05: Captura automática de archivos que superen los 5MB
    return jsonify({
        "success": False,
        "error": "El archivo o petición supera el límite permitido de 5 MB."
    }), 413

@app.route('/api/orders/custom', methods=['POST'])
def create_custom_order():
    # 1. Verificar formato del form (multipart/form-data)
    if 'multipart/form-data' not in request.content_type and 'form-data' not in request.content_type:
        return jsonify({"success": False, "error": "Tipo de contenido inválido. Debe ser multipart/form-data."}), 400

    # 2. Obtener datos de texto
    nombre = request.form.get('cliente_nombre', '').strip()
    email = request.form.get('cliente_email', '').strip()
    telefono = request.form.get('cliente_telefono', '').strip()
    tipo_producto = request.form.get('tipo_producto', '').strip()
    material = request.form.get('material', '').strip()
    color = request.form.get('color', '').strip()
    cantidad_str = request.form.get('cantidad', '1').strip()
    descripcion = request.form.get('descripcion_diseno', '').strip()
    modalidad_entrega = request.form.get('modalidad_entrega', 'pickup').strip()
    direccion_entrega = request.form.get('direccion_entrega', '').strip()

    # 3. Validación de campos obligatorios en el Servidor
    if not all([nombre, email, tipo_producto, material, color, descripcion]):
        return jsonify({"success": False, "error": "Faltan campos de texto obligatorios."}), 400

    try:
        cantidad = int(cantidad_str)
        if cantidad < 1:
            raise ValueError()
    except ValueError:
        return jsonify({"success": False, "error": "La cantidad de unidades debe ser un número entero mayor a cero."}), 400

    # 4. Validación de archivos obligatorios (RF03 / CU03)
    if 'archivos' not in request.files:
        return jsonify({"success": False, "error": "Es obligatorio adjuntar al menos una imagen digital de referencia."}), 400

    uploaded_files = request.files.getlist('archivos')
    
    # Quitar uploads vacíos si los hubiera
    uploaded_files = [f for f in uploaded_files if f.filename != '']
    
    if len(uploaded_files) == 0:
        return jsonify({"success": False, "error": "Debe adjuntar al menos un archivo válido."}), 400

    # Validar extensiones de todos los archivos antes de procesar o guardar nada
    for file in uploaded_files:
        if not allowed_file(file.filename):
            return jsonify({
                "success": False, 
                "error": f"Formato de archivo no válido: '{file.filename}'. Solo se permiten extensiones JPG, JPEG y PNG."
            }), 400

    # 5. Generar código único de seguimiento del pedido
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    order_id = f"ORD-CUST-{random_suffix}"

    conn = get_db_connection()
    saved_file_paths = [] # Tracking local de archivos guardados para rollback físico

    try:
        # Iniciar transacción SQL explícita
        conn.execute("BEGIN TRANSACTION;")
        cursor = conn.cursor()

        # Inserción del pedido
        cursor.execute("""
            INSERT INTO pedidos (id, cliente_nombre, cliente_email, cliente_telefono, tipo_producto, material, color, cantidad, descripcion_diseno, modalidad_entrega, direccion_entrega, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_quotation')
        """, (order_id, nombre, email, telefono, tipo_producto, material, color, cantidad, descripcion, modalidad_entrega, direccion_entrega))

        # Almacenar archivos físicos y registrar rutas
        for index, file in enumerate(uploaded_files):
            # Sanitizar nombre
            orig_name = secure_filename(file.filename)
            # Unificar nombre con ID de pedido para evitar colisiones
            new_name = f"{order_id}_{index}_{orig_name}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_name)
            
            # Guardar en disco
            file.save(file_path)
            saved_file_paths.append(file_path)

            # Insertar en tabla de imágenes relacional
            cursor.execute("""
                INSERT INTO pedido_imagenes (pedido_id, ruta_archivo)
                VALUES (?, ?)
            """, (order_id, file_path))

        # RNF05: Todo funcionó, hacemos commit de la transacción
        conn.commit()

        return jsonify({
            "success": True,
            "trackingCode": order_id,
            "message": "Pedido personalizado registrado exitosamente. Queda en estado 'Pendiente de Presupuesto'."
        }), 201

    except Exception as e:
        # RNF05: Si falla, realizamos rollback de la base de datos
        conn.rollback()
        
        # Y realizamos limpieza física del disco para no dejar archivos huérfanos
        for path in saved_file_paths:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

        return jsonify({
            "success": False,
            "error": "Error interno del servidor al procesar el pedido. Se revirtió la operación."
        }), 500

    finally:
        conn.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True)
