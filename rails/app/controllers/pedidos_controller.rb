class PedidosController < ApplicationController
  before_action :autenticar!
  before_action :solo_admin!, only: :estado

  # Header opcional "Idempotency-Key": si el cliente reenvía la misma petición
  # (doble clic, red inestable) recibe el mismo pedido en vez de crear uno duplicado.
  def create
    datos = Validador.new(cuerpo).lista(:items, min: 1, max: 50) do |item|
      item.id(:producto_id).entero(:cantidad, min: 1, max: 1000)
    end.resultado!
    pedido, repetido = PedidosService.crear(usuario_actual, datos[:items], request.headers["Idempotency-Key"].presence)
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
    render json: recargar(PedidosService.cambiar_estado(id_param, datos[:estado], usuario_actual))
  end

  def cancelar
    render json: recargar(PedidosService.cancelar(id_param, usuario_actual))
  end

  private

  def recargar(pedido) = Pedido.includes(:items, :historial).find(pedido.id)
end
