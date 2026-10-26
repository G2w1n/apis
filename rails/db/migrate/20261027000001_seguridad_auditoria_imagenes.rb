class SeguridadAuditoriaImagenes < ActiveRecord::Migration[8.0]
  def change
    add_column :productos, :imagen_url, :string, limit: 500

    # Quién hizo qué y cuándo
    create_table :auditorias do |t|
      t.string :accion, null: false
      t.string :entidad, null: false
      t.string :entidad_id, null: false
      t.references :usuario, foreign_key: { on_delete: :nullify }
      t.string :ip
      t.jsonb :detalle, null: false, default: {}
      t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
    end
    add_index :auditorias, %i[entidad entidad_id]

    # Fallos de login por IP + email (en la base de datos para que lo compartan todos los procesos)
    create_table :intentos_login do |t|
      t.string :clave, null: false, index: { unique: true }
      t.integer :fallos, null: false, default: 0
      t.datetime :primer_fallo, null: false
      t.datetime :bloqueado_hasta
    end
  end
end
