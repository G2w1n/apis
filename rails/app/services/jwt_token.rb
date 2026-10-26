module JwtToken
  module_function

  def firmar(usuario)
    ahora = Time.now.to_i
    payload = { sub: usuario.id.to_s, rol: usuario.rol, iat: ahora, exp: ahora + Rails.configuration.x.jwt_horas * 3600 }
    JWT.encode(payload, Rails.configuration.x.jwt_secret, "HS256")
  end

  def verificar(token)
    JWT.decode(token, Rails.configuration.x.jwt_secret, true, algorithm: "HS256").first
  end
end
