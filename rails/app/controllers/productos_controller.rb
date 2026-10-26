class ProductosController < ApplicationController
  before_action :solo_admin!, only: %i[create update destroy]

  ORDENES = { "nombre" => :nombre, "precio" => :precio, "stock" => :stock, "creado" => :created_at }.freeze

  # Los filtros se traducen a SQL (WHERE / ILIKE / ORDER BY): la base de datos hace el trabajo
  def index
    rel = Producto.activos.includes(:categoria)
    if params[:q].present?
      patron = "%#{Producto.sanitize_sql_like(params[:q])}%"
      rel = rel.where("nombre ILIKE :p OR sku ILIKE :p", p: patron)
    end
    rel = rel.where(categoria_id: id_param(params[:categoria])) if params[:categoria].present?
    rel = rel.where(precio: BigDecimal(params[:precio_min])..) if params[:precio_min].present?
    rel = rel.where(precio: ..BigDecimal(params[:precio_max])) if params[:precio_max].present?
    rel = rel.bajo_stock if params[:bajo_stock] == "true"
    orden = params.fetch(:orden, "nombre")
    campo = ORDENES.fetch(orden.delete_prefix("-"), :nombre)
    rel = rel.order(campo => orden.start_with?("-") ? :desc : :asc, id: :asc)
    render json: paginar(rel)
  rescue ArgumentError
    raise ErrorNegocio.new(400, "VALIDACION", "Parámetros de filtro inválidos")
  end

  def show
    render json: Producto.activos.includes(:categoria).find_by(id: id_param) || raise(ErrorNegocio.no_encontrado("Producto"))
  end

  def create
    datos = validar(Validador.new(cuerpo).texto(:sku, max: 30).texto(:nombre, max: 120).dinero(:precio))
    render json: ProductosService.crear(datos, usuario_actual, request.remote_ip), status: :created
  end

  def update
    v = Validador.new(cuerpo)
    %i[sku nombre].each { |c| v.texto(c, max: c == :sku ? 30 : 120, opcional: true) }
    v.dinero(:precio, opcional: true)
    v.prohibir(:stock, "El stock solo se modifica con POST /stock/movimientos")
    datos = validar(v, parcial: true)
    raise ErrorNegocio.new(400, "VALIDACION", "Envíe al menos un campo") if datos.empty?
    render json: ProductosService.actualizar(id_param, datos, usuario_actual, request.remote_ip)
  end

  def destroy
    ProductosService.eliminar(id_param, usuario_actual, request.remote_ip)
    head :no_content
  end

  private

  def validar(v, parcial: false)
    v.texto(:descripcion, max: 1000, opcional: true, vacio: true)
     .entero(:stock_minimo, min: 0, opcional: true)
     .id(:categoria_id, opcional: true, nulo: true)
     .url(:imagen_url, max: 500)
    v.entero(:stock, min: 0, opcional: true) unless parcial
    datos = v.resultado!
    datos[:sku] = datos[:sku].upcase if datos[:sku]
    datos
  end
end
