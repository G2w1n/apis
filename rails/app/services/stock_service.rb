module StockService
  module_function

  def registrar(datos, usuario)
    ActiveRecord::Base.transaction do
      producto = Producto.activos.lock.find_by(id: datos[:producto_id]) || raise(ErrorNegocio.no_encontrado("Producto"))
      cantidad = datos[:cantidad]
      if datos[:tipo] == "salida" && producto.stock < cantidad
        raise ErrorNegocio.new(409, "STOCK_INSUFICIENTE", "No hay stock suficiente para esta salida",
                               [ { producto_id: producto.id, nombre: producto.nombre, solicitado: cantidad, disponible: producto.stock } ])
      end
      producto.update!(stock: producto.stock + (datos[:tipo] == "entrada" ? cantidad : -cantidad))
      MovimientoStock.create!(producto:, tipo: datos[:tipo], cantidad:, stock_resultante: producto.stock,
                              motivo: datos[:motivo], usuario:)
    end
  end

  # Todo se calcula con agregaciones SQL (SUM, COUNT, GROUP BY) en lugar de traer filas a memoria
  def reporte
    activos = Producto.activos
    por_estado = Pedido::ESTADOS.index_with(0).merge(Pedido.group(:estado).count)
    vendidos = DetallePedido.joins(:pedido).where.not(pedidos: { estado: "cancelado" })
                            .group(:producto_id, :nombre).order("sum_cantidad DESC").limit(5)
                            .pluck(:producto_id, :nombre, Arel.sql("SUM(cantidad) AS sum_cantidad"), Arel.sql("SUM(subtotal)"))
    {
      total_productos: activos.count,
      unidades_en_stock: activos.sum(:stock),
      valor_inventario: activos.sum("precio * stock").to_f,
      productos_bajo_stock: activos.bajo_stock.count,
      ingresos_totales: Pedido.where.not(estado: "cancelado").sum(:total).to_f,
      pedidos_por_estado: por_estado,
      mas_vendidos: vendidos.map { |id, nombre, unidades, ingresos| { producto_id: id, nombre:, unidades:, ingresos: ingresos.to_f } }
    }
  end
end
