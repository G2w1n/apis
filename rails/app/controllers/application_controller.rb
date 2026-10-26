class ApplicationController < ActionController::API
  # Todas las respuestas de error tienen la forma { error: { codigo, mensaje, detalles? } }
  rescue_from ErrorNegocio do |e|
    e.cabeceras&.each { |nombre, valor| response.set_header(nombre, valor) }
    error = { codigo: e.codigo, mensaje: e.message }
    error[:detalles] = e.detalles if e.detalles
    render json: { error: }, status: e.status
  end
  rescue_from ActiveRecord::Deadlocked do
    render json: { error: { codigo: "CONFLICTO_CONCURRENCIA", mensaje: "Demasiadas operaciones simultáneas, intente de nuevo" } },
           status: :conflict
  end

  def ruta_no_encontrada
    render json: { error: { codigo: "RUTA_NO_ENCONTRADA", mensaje: "No existe #{request.method} #{request.path}" } },
           status: :not_found
  end

  private

  # Leemos el JSON crudo para conservar los tipos originales (1.5 no se convierte en 1)
  def cuerpo
    @cuerpo ||= begin
      request.raw_post.presence ? JSON.parse(request.raw_post) : {}
    rescue JSON::ParserError
      raise ErrorNegocio.new(400, "JSON_INVALIDO", "El cuerpo no es JSON válido")
    end
  end

  def usuario_actual
    return @usuario_actual if defined?(@usuario_actual)
    tipo, token = request.authorization.to_s.split(" ", 2)
    raise ErrorNegocio.new(401, "NO_AUTENTICADO", "Se requiere un token Bearer") unless tipo == "Bearer" && token.present?
    payload = JwtToken.verificar(token)
    @usuario_actual = Usuario.find(payload["sub"])
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    raise ErrorNegocio.new(401, "NO_AUTENTICADO", "Token inválido o expirado")
  end

  def autenticar! = usuario_actual

  def solo_admin!
    raise ErrorNegocio.new(403, "PROHIBIDO", "Solo un administrador puede realizar esta acción") unless usuario_actual.admin?
  end

  # IDs no numéricos (ej. de Firestore) simplemente no existen aquí
  def id_param(valor = params[:id])
    Integer(valor.to_s, exception: false) || raise(ErrorNegocio.no_encontrado)
  end

  def paginar(relacion)
    page = [ params[:page].to_i, 1 ].max
    limit = params[:limit].to_i
    limit = limit.positive? ? [ limit, 100 ].min : 10
    total = relacion.count
    {
      data: relacion.offset((page - 1) * limit).limit(limit).map(&:as_json),
      meta: { page:, limit:, total:, paginas: (total.to_f / limit).ceil }
    }
  end
end
