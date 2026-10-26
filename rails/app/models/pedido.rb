class Pedido < ApplicationRecord
  belongs_to :usuario
  has_many :items, -> { order(:id) }, class_name: "DetallePedido", dependent: :destroy
  has_many :historial, -> { order(:fecha, :id) }, class_name: "HistorialEstado", dependent: :destroy

  ESTADOS = %w[pendiente pagado enviado entregado cancelado].freeze

  # Máquina de estados: transiciones permitidas desde cada estado
  TRANSICIONES = {
    "pendiente" => %w[pagado cancelado],
    "pagado"    => %w[enviado cancelado],
    "enviado"   => %w[entregado],
    "entregado" => [],
    "cancelado" => []
  }.freeze

  def as_json(*)
    {
      id:, usuario_id:, estado:, total: total.to_f,
      items: items.map(&:as_json),
      historial: historial.map { |h| { estado: h.estado, fecha: h.fecha.iso8601(3) } },
      created_at: created_at.iso8601(3)
    }
  end
end
