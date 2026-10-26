# CORS: solo orígenes conocidos pueden llamar a la API desde el navegador
ORIGENES_PERMITIDOS = [
  "https://g2w1n-voltec.onrender.com",
  "https://g2w1n-tienda-panel.onrender.com",
  "https://probandoapi-8c9b8.web.app",
  "https://probandoapi-8c9b8.firebaseapp.com",
  %r{\Ahttp://(localhost|127\.0\.0\.1)(:\d+)?\z},
  *ENV.fetch("CORS_ORIGENES", "").split(",").map(&:strip).reject(&:empty?)
].freeze

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ORIGENES_PERMITIDOS)
    resource "*", headers: :any, expose: [ "Idempotent-Replayed", "Retry-After" ],
                  methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
  end
end
