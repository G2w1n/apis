class Categoria < ApplicationRecord
  self.table_name = "categorias"
  has_many :productos, dependent: :nullify

  def as_json(*) = { id:, nombre:, descripcion: }
end
