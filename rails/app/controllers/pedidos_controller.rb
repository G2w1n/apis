class PedidosController < ApplicationController
  before_action :autenticar!
  before_action :solo_admin!, only: :estado

  # Header opcional "Idempotency-Key": si el cliente reenvía la misma petición
  # (doble clic, red inestable) recibe el mismo pedido en vez de crear uno duplicado.
  def create
    v = Validador.new(cuerpo).lista(:items, min: 1, max: 50) do |item|
      item.id(:producto_id).entero(:cantidad, min: 1, max: 1000)
    end
    v.objeto(:envio, permitidos: %i[nombre telefono direccion distrito referencia]) do |e|
      e.texto(:nombre, max: 100).formato(:telefono, /\A\+?[0-9 ]{6,15}\z/, "Teléfono inválido")
       .texto(:direccion, max: 200).texto(:distrito, max: 60).texto(:referencia, max: 200, opcional: true, vacio: true)
    end
    # Pago simulado: solo se guardan los últimos 4 dígitos
    v.objeto(:pago, permitidos: %i[metodo tarjeta_ultimos4]) do |p|
      p.opcion(:metodo, %w[tarjeta yape contraentrega]).formato(:tarjeta_ultimos4, /\A\d{4}\z/, "Deben ser 4 dígitos", opcional: true)
    end
    datos = v.resultado!
    validar_checkout!(datos)
    pedido, repetido = PedidosService.crear(usuario_actual, datos[:items], request.headers["Idempotency-Key"].presence,
                                            envio: datos[:envio], pago: datos[:pago])
    response.set_header("Idempotent-Replayed", "true") if repetido
    render json: recargar(pedido), status: repetido ? :ok : :created
  end

  def index
    rel = PedidosService.visibles(usuario_actual)
    rel = rel.where(estado: params[:estado]) if params[:estado].present?
    render json: paginar(rel)
  end

  def show
    render json: PedidosService.visibles(usuario_actual).find_by(id: id_param) || raise(ErrorNegocio.no_encontrado("Pedido"))
  end

  def estado
    datos = Validador.new(cuerpo).opcion(:estado, Pedido::ESTADOS).resultado!
    render json: recargar(PedidosService.cambiar_estado(id_param, datos[:estado], usuario_actual, request.remote_ip))
  end

  def cancelar
    render json: recargar(PedidosService.cancelar(id_param, usuario_actual, request.remote_ip))
  end

  private

  def recargar(pedido) = Pedido.includes(:items, :historial).find(pedido.id)

  def validar_checkout!(datos)
    errores = []
    errores << { campo: "pago", mensaje: "Indica el método de pago" } if datos[:envio] && !datos[:pago]
    errores << { campo: "envio", mensaje: "Indica los datos de envío" } if datos[:pago] && !datos[:envio]
    if (pago = datos[:pago])
      if pago[:metodo] == "tarjeta" && !pago[:tarjeta_ultimos4]
        errores << { campo: "pago.tarjeta_ultimos4", mensaje: "Es obligatorio para pagar con tarjeta" }
      elsif pago[:metodo] != "tarjeta" && pago[:tarjeta_ultimos4]
        errores << { campo: "pago.tarjeta_ultimos4", mensaje: "Solo aplica a tarjeta" }
      end
    end
    raise ErrorNegocio.new(400, "VALIDACION", "Los datos enviados no son válidos", errores) if errores.any?
  end
end
