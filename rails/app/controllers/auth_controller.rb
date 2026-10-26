class AuthController < ApplicationController
  def register
    datos = Validador.new(cuerpo).texto(:nombre, max: 100).email(:email).password_fuerte(:password).resultado!
    raise ErrorNegocio.new(409, "EMAIL_EN_USO", "El email ya está registrado") if Usuario.exists?(email: datos[:email])

    usuario = Usuario.create!(datos.merge(rol: "cliente"))
    render json: { usuario:, token: JwtToken.firmar(usuario) }, status: :created
  rescue ActiveRecord::RecordNotUnique
    raise ErrorNegocio.new(409, "EMAIL_EN_USO", "El email ya está registrado")
  end

  def login
    datos = Validador.new(cuerpo).email(:email).texto(:password, max: 200).resultado!
    ip = request.remote_ip
    IntentosLoginService.verificar!(ip, datos[:email]) # 429 si esta IP + email está bloqueada
    usuario = Usuario.find_by(email: datos[:email])&.authenticate(datos[:password])
    unless usuario
      IntentosLoginService.registrar_fallo(ip, datos[:email])
      raise ErrorNegocio.new(401, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos")
    end
    IntentosLoginService.limpiar(ip, datos[:email])

    render json: { usuario:, token: JwtToken.firmar(usuario) }
  end

  def me = render(json: usuario_actual)
end
