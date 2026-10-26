# Kardex: cada cambio de stock queda registrado con el saldo resultante
class MovimientoStock < ApplicationRecord
  self.table_name = "movimientos_stock"
  belongs_to :producto
  belongs_to :pedido, optional: true
  belongs_to :usuario, optional: true

  TIPOS = %w[entrada salida].freeze

  def as_json(*)
    {
      id:, producto_id:, producto_nombre: producto.nombre, tipo:, cantidad:, stock_resultante:,
      motivo:, pedido_id:, usuario_id:, created_at: created_at.iso8601(3)
    }
  end
end
