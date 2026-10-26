# Estrategia anti-sobreventa en PostgreSQL:
#   transaction  -> todo o nada
#   .lock        -> SELECT ... FOR UPDATE: bloquea las filas de los productos; una compra simultánea
#                   ESPERA y luego ve el stock ya descontado
#   CHECK        -> la base de datos rechaza stock < 0 aunque el código fallara
module PedidosService
  module_function

  # Devuelve [pedido, repetido]. Si la Idempotency-Key ya se usó, devuelve el pedido original.
  def crear(usuario, items, clave = nil)
    if clave && (previo = usuario.pedidos.find_by(idempotency_key: clave))
      return [ previo, true ]
    end
    [ crear_atomico(usuario, agrupar(items), clave), false ]
  rescue ActiveRecord::RecordNotUnique
    # Dos peticiones con la misma clave llegaron a la vez: el índice UNIQUE frenó a una
    previo = usuario.pedidos.find_by(idempotency_key: clave)
    previo ? [ previo, true ] : raise
  end

  def agrupar(items)
    items.each_with_object(Hash.new(0)) { |i, h| h[i[:producto_id]] += i[:cantidad] }
  end

  def crear_atomico(usuario, cantidades, clave)
    ActiveRecord::Base.transaction do
      # Ordenar por id evita deadlocks cuando dos pedidos bloquean los mismos productos
      productos = Producto.activos.where(id: cantidades.keys).order(:id).lock.index_by(&:id)

      no_disponibles = cantidades.keys.reject { |id| productos[id] }.map { |id| { producto_id: id } }
      if no_disponibles.any?
        raise ErrorNegocio.new(422, "PRODUCTO_NO_DISPONIBLE", "Algunos productos no existen o fueron retirados", no_disponibles)
      end
      sin_stock = cantidades.filter_map do |id, cant|
        p = productos[id]
        { producto_id: id, nombre: p.nombre, solicitado: cant, disponible: p.stock } if p.stock < cant
      end
      raise ErrorNegocio.new(409, "STOCK_INSUFICIENTE", "No hay stock suficiente", sin_stock) if sin_stock.any?

      # BigDecimal = aritmética exacta: 0.1 + 0.2 == 0.3
      total = cantidades.sum(BigDecimal("0")) { |id, cant| productos[id].precio * cant }
      pedido = usuario.pedidos.create!(total:, idempotency_key: clave)
      pedido.historial.create!(estado: "pendiente")

      cantidades.each do |id, cant|
        p = productos[id]
        p.update!(stock: p.stock - cant)
        pedido.items.create!(producto: p, sku: p.sku, nombre: p.nombre, cantidad: cant,
                             precio_unitario: p.precio, subtotal: p.precio * cant)
        MovimientoStock.create!(producto: p, tipo: "salida", cantidad: cant, stock_resultante: p.stock,
                                motivo: "Venta - pedido #{pedido.id}", pedido:, usuario:)
      end
      pedido
    end
  end

  def visibles(usuario)
    base = Pedido.includes(:items, :historial).order(created_at: :desc, id: :desc)
    usuario.admin? ? base : base.where(usuario:)
  end

  def cancelar(id, usuario)
    ActiveRecord::Base.transaction do
      pedido = bloquear(id, usuario)
      validar_transicion!(pedido.estado, "cancelado")
      detalles = pedido.items.to_a
      productos = Producto.where(id: detalles.map(&:producto_id)).order(:id).lock.index_by(&:id)
      detalles.each do |d|
        p = productos[d.producto_id]
        p.update!(stock: p.stock + d.cantidad)
        MovimientoStock.create!(producto: p, tipo: "entrada", cantidad: d.cantidad, stock_resultante: p.stock,
                                motivo: "Cancelación - pedido #{pedido.id}", pedido:, usuario:)
      end
      pedido.update!(estado: "cancelado")
      pedido.historial.create!(estado: "cancelado")
      pedido
    end
  end

  def cambiar_estado(id, estado, usuario)
    return cancelar(id, usuario) if estado == "cancelado"
    ActiveRecord::Base.transaction do
      pedido = bloquear(id, usuario)
      validar_transicion!(pedido.estado, estado)
      pedido.update!(estado:)
      pedido.historial.create!(estado:)
      pedido
    end
  end

  # Un cliente que pide un pedido ajeno recibe 404: no revelamos que existe
  def bloquear(id, usuario)
    pedido = Pedido.lock.find_by(id:)
    raise ErrorNegocio.no_encontrado("Pedido") if pedido.nil? || (!usuario.admin? && pedido.usuario_id != usuario.id)
    pedido
  end

  def validar_transicion!(actual, nuevo)
    permitidos = Pedido::TRANSICIONES.fetch(actual)
    return if permitidos.include?(nuevo)
    raise ErrorNegocio.new(422, "TRANSICION_INVALIDA", %(No se puede pasar de "#{actual}" a "#{nuevo}"),
                           { estado_actual: actual, permitidos: })
  end
end
