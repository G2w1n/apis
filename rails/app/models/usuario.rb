class Usuario < ApplicationRecord
  has_secure_password # bcrypt: guarda password_digest, nunca la contraseña en texto plano
  has_many :pedidos, dependent: :restrict_with_exception

  ROLES = %w[admin cliente].freeze

  def admin? = rol == "admin"

  def as_json(*) = { id:, nombre:, email:, rol: }
end
