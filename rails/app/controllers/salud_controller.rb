class SaludController < ApplicationController
  def show = render(json: { status: "ok", framework: "rails", base_datos: "postgresql" })
end
