Rails.application.routes.draw do
  get "health", to: "salud#show"

  scope "api/v1", defaults: { format: :json } do
    get  "health",        to: "salud#show"
    post "auth/register", to: "auth#register"
    post "auth/login",    to: "auth#login"
    get  "auth/me",       to: "auth#me"

    resources :categorias, only: %i[index create]
    resources :productos,  only: %i[index show create update destroy]

    resources :pedidos, only: %i[index show create] do
      member do
        patch :estado
        post  :cancelar
      end
    end

    scope "stock", controller: :stock do
      get  "movimientos", action: :movimientos
      post "movimientos", action: :registrar
      get  "alertas"
      get  "reporte"
    end
  end

  match "*ruta", to: "application#ruta_no_encontrada", via: :all
end
