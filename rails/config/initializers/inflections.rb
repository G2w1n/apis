# Plurales en español para que Rails infiera bien tablas y clases
ActiveSupport::Inflector.inflections(:en) do |inflect|
  inflect.irregular "categoria", "categorias"
  inflect.irregular "producto", "productos"
  inflect.irregular "pedido", "pedidos"
  inflect.irregular "usuario", "usuarios"
end
