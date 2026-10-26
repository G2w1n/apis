# bin/rails db:seed — borra todo y carga ../shared/seed.json (los mismos datos que Express y Django)
seed = JSON.parse(Rails.root.join("..", "shared", "seed.json").read, symbolize_names: true)

ActiveRecord::Base.transaction do
  [ MovimientoStock, DetallePedido, HistorialEstado, Pedido, Producto, Categoria, Usuario ].each(&:delete_all)

  seed[:usuarios].each { |u| Usuario.create!(u) }
  admin = Usuario.find_by!(email: "admin@tienda.pe")
  categorias = seed[:categorias].to_h { |c| [ c[:nombre], Categoria.create!(c) ] }
  seed[:productos].each do |p|
    datos = p.except(:categoria).merge(categoria_id: categorias.fetch(p[:categoria]).id, precio: BigDecimal(p[:precio].to_s))
    ProductosService.crear(datos, admin)
  end
end

puts "Seed listo: #{seed[:usuarios].size} usuarios, #{seed[:categorias].size} categorías, #{seed[:productos].size} productos"
