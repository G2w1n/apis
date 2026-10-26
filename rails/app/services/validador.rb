# Valida el JSON de entrada SIN conversiones silenciosas (Rails convertiría 1.5 -> 1 en una columna integer).
# Uso: Validador.new(datos).texto(:nombre, max: 100).entero(:stock, min: 0, opcional: true).resultado!
class Validador
  def initialize(datos)
    @datos = datos.is_a?(Hash) ? datos : {}
    @limpio = {}
    @errores = []
  end

  def texto(campo, max:, opcional: false, vacio: false)
    leer(campo, opcional) do |v|
      next error(campo, "Debe ser texto") unless v.is_a?(String)
      v = v.strip
      next error(campo, "Es obligatorio") if v.empty? && !vacio
      next error(campo, "Máximo #{max} caracteres") if v.length > max
      v
    end
  end

  def email(campo)
    leer(campo, false) do |v|
      v.is_a?(String) && v.strip.match?(URI::MailTo::EMAIL_REGEXP) ? v.strip.downcase : error(campo, "Email inválido")
    end
  end

  def entero(campo, min:, max: nil, opcional: false)
    leer(campo, opcional) do |v|
      next error(campo, "Debe ser entero") unless v.is_a?(Integer)
      next error(campo, "Debe ser mayor o igual a #{min}") if v < min
      next error(campo, "Debe ser menor o igual a #{max}") if max && v > max
      v
    end
  end

  # Precio: número positivo con máximo 2 decimales, convertido a BigDecimal (aritmética exacta)
  def dinero(campo, opcional: false)
    leer(campo, opcional) do |v|
      next error(campo, "Debe ser un número") unless v.is_a?(Numeric)
      d = BigDecimal(v.to_s)
      next error(campo, "Debe ser mayor a 0") unless d.positive?
      next error(campo, "Máximo 2 decimales") unless d.round(2) == d
      next error(campo, "Valor demasiado alto") if d > 1_000_000
      d
    end
  end

  # Solo http(s) o rutas relativas: bloquea "javascript:" y otros esquemas peligrosos
  def url(campo, max:, opcional: true)
    leer(campo, opcional, nulo: true) do |v|
      next error(campo, "Debe ser texto") unless v.is_a?(String)
      v = v.strip
      next error(campo, "Máximo #{max} caracteres") if v.length > max
      next error(campo, "Debe ser una URL http(s) o una ruta que empiece con /") unless v.match?(%r{\A(https?://|/)})
      v
    end
  end

  # Contraseña fuerte: evita claves fáciles de adivinar como "12345678" o "password"
  def password_fuerte(campo)
    leer(campo, false) do |v|
      next error(campo, "Debe ser texto") unless v.is_a?(String)
      reglas = { /.{8,}/ => "Mínimo 8 caracteres", /[A-Z]/ => "Debe tener al menos una mayúscula",
                 /[a-z]/ => "Debe tener al menos una minúscula", /\d/ => "Debe tener al menos un número",
                 /[^A-Za-z0-9]/ => "Debe tener al menos un símbolo" }
      fallas = reglas.reject { |patron, _| v.match?(patron) }.values
      next error(campo, "Máximo 72 caracteres") if v.length > 72
      fallas.empty? ? v : fallas.map { |m| error(campo, m) }.last
    end
  end

  def id(campo, opcional: false, nulo: false)
    leer(campo, opcional, nulo:) do |v|
      Integer(v.to_s, exception: false) || error(campo, "Identificador inválido")
    end
  end

  def opcion(campo, opciones)
    leer(campo, false) { |v| opciones.include?(v) ? v : error(campo, "Debe ser uno de: #{opciones.join(', ')}") }
  end

  def lista(campo, min:, max:)
    leer(campo, false) do |v|
      next error(campo, "Debe ser una lista") unless v.is_a?(Array)
      next error(campo, "Debe tener al menos #{min} elemento(s)") if v.size < min
      next error(campo, "Máximo #{max} elementos") if v.size > max
      v.each_with_index.map do |elem, i|
        sub = yield Validador.new(elem)
        sub.errores.each { |e| @errores << { campo: "#{campo}.#{i}.#{e[:campo]}", mensaje: e[:mensaje] } }
        sub.limpio
      end
    end
  end

  def prohibir(campo, mensaje)
    error(campo, mensaje) if @datos.key?(campo.to_s)
    self
  end

  def agregar_error(campo, mensaje)
    error(campo, mensaje)
    self
  end

  attr_reader :errores, :limpio

  def resultado!
    return @limpio if @errores.empty?
    raise ErrorNegocio.new(400, "VALIDACION", "Los datos enviados no son válidos", @errores)
  end

  private

  def leer(campo, opcional, nulo: false)
    clave = campo.to_s
    if !@datos.key?(clave) || (@datos[clave].nil? && !nulo)
      error(campo, "Es obligatorio") unless opcional
    elsif @datos[clave].nil?
      @limpio[campo] = nil
    else
      valor = yield @datos[clave]
      @limpio[campo] = valor unless valor == :invalido
    end
    self
  end

  def error(campo, mensaje)
    @errores << { campo: campo.to_s, mensaje: }
    :invalido
  end
end
