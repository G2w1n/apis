class SaludController < ApplicationController
  def show = render(json: { status: "ok", framework: "rails", base_datos: "postgresql" })

  # Página de bienvenida: quien abra la URL base ve qué API es y qué rutas tiene
  def inicio
    render json: {
      api: "Tienda API (productos, pedidos y stock)", framework: "rails", base_datos: "postgresql", version: "v1",
      documentacion: "/docs",
      rutas: %w[/api/v1/health /api/v1/productos /api/v1/categorias /api/v1/auth/login /api/v1/pedidos /api/v1/stock/reporte],
      repositorio: "https://github.com/G2w1n/apis"
    }
  end
end
