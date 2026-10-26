module ProductosService
  module_function

  def crear(datos, usuario, ip = nil)
    ActiveRecord::Base.transaction do
      raise sku_duplicado(datos[:sku]) if Producto.exists?(sku: datos[:sku])
      producto = Producto.create!(datos.merge(categoria: categoria(datos.delete(:categoria_id))))
      if producto.stock.positive?
        MovimientoStock.create!(producto:, tipo: "entrada", cantidad: producto.stock, stock_resultante: producto.stock,
                                motivo: "Stock inicial", usuario:)
      end
      AuditoriaService.registrar(usuario, ip, "producto.crear", "producto", producto.id,
                                 { sku: producto.sku, nombre: producto.nombre, precio: producto.precio.to_f, stock: producto.stock })
      producto
    end
  rescue ActiveRecord::RecordNotUnique
    raise sku_duplicado(datos[:sku])
  end

  def actualizar(id, datos, usuario = nil, ip = nil)
    ActiveRecord::Base.transaction do
      producto = Producto.activos.lock.find_by(id:) || raise(ErrorNegocio.no_encontrado("Producto"))
      raise sku_duplicado(datos[:sku]) if datos[:sku] && Producto.where(sku: datos[:sku]).where.not(id:).exists?
      datos[:categoria] = categoria(datos.delete(:categoria_id)) if datos.key?(:categoria_id)
      producto.update!(datos)
      cambios = AuditoriaService.diferencias(producto)
      AuditoriaService.registrar(usuario, ip, "producto.actualizar", "producto", producto.id, { cambios: }) if cambios.any?
      producto
    end
  end

  # Borrado lógico: el kardex y los pedidos antiguos siguen apuntando al producto
  def eliminar(id, usuario = nil, ip = nil)
    ActiveRecord::Base.transaction do
      producto = Producto.activos.lock.find_by(id:) || raise(ErrorNegocio.no_encontrado("Producto"))
      producto.update!(activo: false)
      AuditoriaService.registrar(usuario, ip, "producto.eliminar", "producto", producto.id, { sku: producto.sku, nombre: producto.nombre })
    end
  end

  def categoria(id)
    return nil if id.nil?
    Categoria.find_by(id:) || raise(ErrorNegocio.new(422, "CATEGORIA_INVALIDA", "La categoría indicada no existe"))
  end

  def sku_duplicado(sku) = ErrorNegocio.new(409, "SKU_DUPLICADO", "Ya existe un producto con SKU #{sku}")
end
