class AuthController < ApplicationController
  def register
    datos = Validador.new(cuerpo).texto(:nombre, max: 100).email(:email).texto(:password, max: 72).resultado!
    if datos[:password].length < 8
      raise ErrorNegocio.new(400, "VALIDACION", "Los datos enviados no son válidos", [ { campo: "password", mensaje: "Mínimo 8 caracteres" } ])
    end
    raise ErrorNegocio.new(409, "EMAIL_EN_USO", "El email ya está registrado") if Usuario.exists?(email: datos[:email])

    usuario = Usuario.create!(datos.merge(rol: "cliente"))
    render json: { usuario:, token: JwtToken.firmar(usuario) }, status: :created
  rescue ActiveRecord::RecordNotUnique
    raise ErrorNegocio.new(409, "EMAIL_EN_USO", "El email ya está registrado")
  end

  def login
    datos = Validador.new(cuerpo).email(:email).texto(:password, max: 200).resultado!
    usuario = Usuario.find_by(email: datos[:email])&.authenticate(datos[:password])
    raise ErrorNegocio.new(401, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos") unless usuario

    render json: { usuario:, token: JwtToken.firmar(usuario) }
  end

  def me = render(json: usuario_actual)
end
