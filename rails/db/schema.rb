# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_10_26_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "categorias", force: :cascade do |t|
    t.string "nombre", null: false
    t.string "descripcion", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "lower((nombre)::text)", name: "index_categorias_nombre_unico", unique: true
  end

  create_table "detalles_pedido", force: :cascade do |t|
    t.bigint "pedido_id", null: false
    t.bigint "producto_id", null: false
    t.string "sku", null: false
    t.string "nombre", null: false
    t.integer "cantidad", null: false
    t.decimal "precio_unitario", precision: 10, scale: 2, null: false
    t.decimal "subtotal", precision: 12, scale: 2, null: false
    t.index ["pedido_id"], name: "index_detalles_pedido_on_pedido_id"
    t.index ["producto_id"], name: "index_detalles_pedido_on_producto_id"
  end

  create_table "historial_estados", force: :cascade do |t|
    t.bigint "pedido_id", null: false
    t.string "estado", null: false
    t.datetime "fecha", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["pedido_id"], name: "index_historial_estados_on_pedido_id"
  end

  create_table "movimientos_stock", force: :cascade do |t|
    t.bigint "producto_id", null: false
    t.string "tipo", null: false
    t.integer "cantidad", null: false
    t.integer "stock_resultante", null: false
    t.string "motivo", null: false
    t.bigint "pedido_id"
    t.bigint "usuario_id"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["pedido_id"], name: "index_movimientos_stock_on_pedido_id"
    t.index ["producto_id", "created_at"], name: "index_movimientos_stock_on_producto_id_and_created_at"
    t.index ["producto_id"], name: "index_movimientos_stock_on_producto_id"
    t.index ["usuario_id"], name: "index_movimientos_stock_on_usuario_id"
  end

  create_table "pedidos", force: :cascade do |t|
    t.bigint "usuario_id", null: false
    t.string "estado", default: "pendiente", null: false
    t.decimal "total", precision: 12, scale: 2, null: false
    t.string "idempotency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["usuario_id", "idempotency_key"], name: "index_pedidos_on_usuario_id_and_idempotency_key", unique: true, where: "(idempotency_key IS NOT NULL)"
    t.index ["usuario_id"], name: "index_pedidos_on_usuario_id"
  end

  create_table "productos", force: :cascade do |t|
    t.string "sku", null: false
    t.string "nombre", null: false
    t.text "descripcion", default: "", null: false
    t.decimal "precio", precision: 10, scale: 2, null: false
    t.integer "stock", default: 0, null: false
    t.integer "stock_minimo", default: 0, null: false
    t.bigint "categoria_id"
    t.boolean "activo", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["categoria_id"], name: "index_productos_on_categoria_id"
    t.index ["sku"], name: "index_productos_on_sku", unique: true
    t.check_constraint "precio > 0::numeric", name: "precio_positivo"
    t.check_constraint "stock >= 0", name: "stock_no_negativo"
  end

  create_table "usuarios", force: :cascade do |t|
    t.string "nombre", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "rol", default: "cliente", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_usuarios_on_email", unique: true
  end

  add_foreign_key "detalles_pedido", "pedidos", on_delete: :cascade
  add_foreign_key "detalles_pedido", "productos"
  add_foreign_key "historial_estados", "pedidos", on_delete: :cascade
  add_foreign_key "movimientos_stock", "pedidos", on_delete: :nullify
  add_foreign_key "movimientos_stock", "productos"
  add_foreign_key "movimientos_stock", "usuarios", on_delete: :nullify
  add_foreign_key "pedidos", "usuarios"
  add_foreign_key "productos", "categorias", on_delete: :nullify
end
