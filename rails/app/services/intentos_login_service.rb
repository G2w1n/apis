# Protección contra fuerza bruta: 5 fallos seguidos bloquean esa IP + email por 15 minutos
module IntentosLoginService
  module_function

  MAX_FALLOS = 5
  BLOQUEO = 15.minutes

  def clave(ip, email) = Digest::SHA256.hexdigest("#{ip}|#{email}")

  def verificar!(ip, email)
    intento = IntentoLogin.where(clave: clave(ip, email)).where("bloqueado_hasta > ?", Time.current).first
    return unless intento
    segundos = (intento.bloqueado_hasta - Time.current).ceil
    raise ErrorNegocio.new(429, "DEMASIADOS_INTENTOS",
                           "Demasiados intentos fallidos. Intenta de nuevo en #{(segundos / 60.0).ceil} minuto(s).",
                           nil, { "Retry-After" => segundos.to_s })
  end

  def registrar_fallo(ip, email)
    ActiveRecord::Base.transaction do
      ahora = Time.current
      intento = IntentoLogin.lock.find_or_create_by!(clave: clave(ip, email)) { |i| i.primer_fallo = ahora }
      intento.assign_attributes(fallos: 0, primer_fallo: ahora) if ahora - intento.primer_fallo > BLOQUEO # fallos viejos no cuentan
      intento.fallos += 1
      if intento.fallos >= MAX_FALLOS
        intento.assign_attributes(fallos: 0, primer_fallo: ahora, bloqueado_hasta: ahora + BLOQUEO)
        AuditoriaService.registrar(nil, ip, "auth.bloqueo", "usuario", email, { email:, minutos: (BLOQUEO / 60).to_i })
      end
      intento.save!
    end
  rescue ActiveRecord::RecordNotUnique
    retry # dos fallos simultáneos crearon el registro a la vez
  end

  def limpiar(ip, email) = IntentoLogin.where(clave: clave(ip, email)).delete_all
end
