class CrearEsquemaTienda < ActiveRecord::Migration[8.0]
  def change
    create_table :usuarios do |t|
      t.string :nombre, null: false
      t.string :email, null: false, index: { unique: true }
      t.string :password_digest, null: false
      t.string :rol, null: false, default: "cliente"
      t.timestamps
    end

    create_table :categorias do |t|
      t.string :nombre, null: false
      t.string :descripcion, null: false, default: ""
      t.timestamps
    end
    add_index :categorias, "lower(nombre)", unique: true, name: "index_categorias_nombre_unico"

    create_table :productos do |t|
      t.string :sku, null: false, index: { unique: true }
      t.string :nombre, null: false
      t.text :descripcion, null: false, default: ""
      t.decimal :precio, precision: 10, scale: 2, null: false
      t.integer :stock, null: false, default: 0
      t.integer :stock_minimo, null: false, default: 0
      t.references :categoria, foreign_key: { on_delete: :nullify }
      t.boolean :activo, null: false, default: true
      t.timestamps
    end
    # Última línea de defensa: PostgreSQL rechaza stock negativo aunque el código fallara
    add_check_constraint :productos, "stock >= 0", name: "stock_no_negativo"
    add_check_constraint :productos, "precio > 0", name: "precio_positivo"

    create_table :pedidos do |t|
      t.references :usuario, null: false, foreign_key: true
      t.string :estado, null: false, default: "pendiente"
      t.decimal :total, precision: 12, scale: 2, null: false
      t.string :idempotency_key
      t.timestamps
    end
    add_index :pedidos, %i[usuario_id idempotency_key], unique: true, where: "idempotency_key IS NOT NULL"

    create_table :detalles_pedido do |t|
      t.references :pedido, null: false, foreign_key: { on_delete: :cascade }
      t.references :producto, null: false, foreign_key: true
      t.string :sku, null: false
      t.string :nombre, null: false
      t.integer :cantidad, null: false
      t.decimal :precio_unitario, precision: 10, scale: 2, null: false
      t.decimal :subtotal, precision: 12, scale: 2, null: false
    end

    create_table :historial_estados do |t|
      t.references :pedido, null: false, foreign_key: { on_delete: :cascade }
      t.string :estado, null: false
      t.datetime :fecha, null: false, default: -> { "CURRENT_TIMESTAMP" }
    end

    create_table :movimientos_stock do |t|
      t.references :producto, null: false, foreign_key: true
      t.string :tipo, null: false
      t.integer :cantidad, null: false
      t.integer :stock_resultante, null: false
      t.string :motivo, null: false
      t.references :pedido, foreign_key: { on_delete: :nullify }
      t.references :usuario, foreign_key: { on_delete: :nullify }
      t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
    end
    add_index :movimientos_stock, %i[producto_id created_at]
  end
end
