# Sirve la documentación Swagger compartida por las 3 APIs (../shared)
class DocsController < ApplicationController
  SHARED = Rails.root.join("..", "shared")
  # Swagger UI carga JS y CSS desde unpkg: esta página lleva su propia Content-Security-Policy
  CSP = "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; " \
        "img-src 'self' data: https:; connect-src 'self'"

  def html
    response.set_header("Content-Security-Policy", CSP)
    render html: SHARED.join("docs.html").read.html_safe
  end

  def js = render(plain: SHARED.join("docs.js").read, content_type: "application/javascript")
  def openapi = render(plain: SHARED.join("openapi.yaml").read, content_type: "text/yaml")
end
