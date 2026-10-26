module AuditoriaService
  module_function

  # Se llama dentro de la misma transacción que el cambio: o se guardan ambos o ninguno
  def registrar(usuario, ip, accion, entidad, entidad_id, detalle = {})
    Auditoria.create!(usuario:, ip:, accion:, entidad:, entidad_id: entidad_id.to_s, detalle:)
  end

  # { precio: { antes: 10.1, despues: 15.5 } } solo con lo que realmente cambió
  def diferencias(registro)
    registro.saved_changes.except("updated_at").to_h do |campo, (antes, despues)|
      [ campo, { antes: valor_json(antes), despues: valor_json(despues) } ]
    end
  end

  def valor_json(v) = v.is_a?(BigDecimal) ? v.to_f : v
end
