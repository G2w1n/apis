class StockController < ApplicationController
  before_action :solo_admin!

  def registrar
    datos = Validador.new(cuerpo).id(:producto_id).opcion(:tipo, MovimientoStock::TIPOS)
                     .entero(:cantidad, min: 1, max: 100_000).texto(:motivo, max: 200).resultado!
    render json: StockService.registrar(datos, usuario_actual), status: :created
  end

  # Kardex: del más reciente al más antiguo
  def movimientos
    rel = MovimientoStock.includes(:producto).order(created_at: :desc, id: :desc)
    rel = rel.where(producto_id: id_param(params[:producto_id])) if params[:producto_id].present?
    rel = rel.where(tipo: params[:tipo]) if params[:tipo].present?
    render json: paginar(rel)
  end

  def alertas
    productos = Producto.activos.bajo_stock.includes(:categoria).order(Arel.sql("stock_minimo - stock DESC"), :id)
    render json: { data: productos.map { |p| p.as_json.merge(faltante: p.stock_minimo - p.stock) } }
  end

  def reporte = render(json: StockService.reporte)
end
