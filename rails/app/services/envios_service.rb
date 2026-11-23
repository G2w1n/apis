# Tarifas de envío compartidas por las 3 APIs. El costo SIEMPRE lo calcula el servidor.
module EnviosService
  module_function

  TARIFAS = JSON.parse(Rails.root.join("..", "shared", "envios.json").read).freeze

  # Devuelve [costo, tarifa] o lanza 422 si no llegamos a ese distrito
  def cotizar(distrito, subtotal)
    tarifa = TARIFAS["distritos"].find { |d| d["distrito"].casecmp?(distrito.strip) }
    unless tarifa
      raise ErrorNegocio.new(422, "DISTRITO_SIN_COBERTURA", "Aún no hacemos envíos a #{distrito}",
                             { distritos: TARIFAS["distritos"].map { |d| d["distrito"] } })
    end
    gratis = subtotal >= BigDecimal(TARIFAS["gratis_desde"].to_s)
    [ gratis ? BigDecimal("0") : BigDecimal(tarifa["costo"].to_s), tarifa ]
  end
end
