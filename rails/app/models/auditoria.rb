class Auditoria < ApplicationRecord
  self.table_name = "auditorias"
  belongs_to :usuario, optional: true

  def as_json(*)
    {
      id:, accion:, entidad:, entidad_id:, usuario_id:, usuario_email: usuario&.email,
      ip:, detalle:, created_at: created_at.iso8601(3)
    }
  end
end
