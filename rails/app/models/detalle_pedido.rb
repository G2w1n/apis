# Copia los datos del producto al momento de la compra (si cambia el precio, el pedido no cambia)
class DetallePedido < ApplicationRecord
  self.table_name = "detalles_pedido"
  belongs_to :pedido
  belongs_to :producto

  def as_json(*)
    { producto_id:, sku:, nombre:, cantidad:, precio_unitario: precio_unitario.to_f, subtotal: subtotal.to_f }
  end
end
