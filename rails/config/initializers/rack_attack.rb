# Límite general de peticiones por IP y por minuto (memoria del proceso; con varias instancias se usaría Redis)
Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

Rack::Attack.throttle("peticiones/ip", limit: ENV.fetch("RATE_LIMIT_POR_MINUTO", 600).to_i, period: 60) do |req|
  req.ip unless req.path.end_with?("/health")
end

Rack::Attack.throttled_responder = lambda do |req|
  reintento = (req.env["rack.attack.match_data"] || {})[:period].to_i - (Time.now.to_i % 60)
  [ 429, { "content-type" => "application/json", "retry-after" => [ reintento, 1 ].max.to_s },
    [ { error: { codigo: "LIMITE_PETICIONES", mensaje: "Demasiadas peticiones desde tu red. Espera un momento." } }.to_json ] ]
end
