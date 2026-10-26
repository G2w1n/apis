class Producto < ApplicationRecord
  belongs_to :categoria, optional: true
  has_many :movimientos, class_name: "MovimientoStock", dependent: :restrict_with_exception

  scope :activos, -> { where(activo: true) }
  scope :bajo_stock, -> { where("stock <= stock_minimo") }

  def bajo_stock? = stock <= stock_minimo

  def as_json(*)
    {
      id:, sku:, nombre:, descripcion:,
      precio: precio.to_f, stock:, stock_minimo:, bajo_stock: bajo_stock?,
      categoria: categoria && { id: categoria.id, nombre: categoria.nombre },
      activo:, created_at: created_at.iso8601(3), updated_at: updated_at.iso8601(3)
    }
  end
end
