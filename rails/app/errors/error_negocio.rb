# Error con código HTTP y código legible (mismo formato en las 3 APIs)
class ErrorNegocio < StandardError
  attr_reader :status, :codigo, :detalles, :cabeceras

  def initialize(status, codigo, mensaje, detalles = nil, cabeceras = nil)
    super(mensaje)
    @status = status
    @codigo = codigo
    @detalles = detalles
    @cabeceras = cabeceras # ej. { "Retry-After" => "900" }
  end

  def self.no_encontrado(recurso = "Recurso") = new(404, "NO_ENCONTRADO", "#{recurso} no encontrado")
end
