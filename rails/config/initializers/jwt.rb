Rails.application.config.x.jwt_secret = ENV.fetch("JWT_SECRET", "cambia-este-secreto-en-produccion")
Rails.application.config.x.jwt_horas = ENV.fetch("JWT_HORAS", 8).to_i
