class AuditoriaController < ApplicationController
  before_action :solo_admin!

  def index
    rel = Auditoria.includes(:usuario).order(created_at: :desc, id: :desc)
    %i[entidad entidad_id accion].each { |campo| rel = rel.where(campo => params[campo]) if params[campo].present? }
    render json: paginar(rel)
  end
end
