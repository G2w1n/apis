class CategoriasController < ApplicationController
  before_action :solo_admin!, only: :create

  def index = render(json: { data: Categoria.order(:nombre) })

  def create
    datos = Validador.new(cuerpo).texto(:nombre, max: 60).texto(:descripcion, max: 300, opcional: true, vacio: true).resultado!
    if Categoria.where("lower(nombre) = ?", datos[:nombre].downcase).exists?
      raise ErrorNegocio.new(409, "CATEGORIA_DUPLICADA", "Ya existe una categoría con ese nombre")
    end
    render json: Categoria.create!(datos), status: :created
  end
end
