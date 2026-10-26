class HistorialEstado < ApplicationRecord
  self.table_name = "historial_estados"
  belongs_to :pedido
end
