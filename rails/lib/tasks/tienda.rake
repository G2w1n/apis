namespace :tienda do
  desc "Carga los datos de ejemplo solo si la base está vacía (para ejecutarlo en cada arranque en la nube)"
  task seed_si_vacio: :environment do
    if Usuario.exists?
      # Base ya cargada: solo se asignan las imágenes de ejemplo a los productos que aún no tienen una
      seed = JSON.parse(Rails.root.join("..", "shared", "seed.json").read)
      asignadas = seed["productos"].select { |p| p["imagen_url"] }.sum do |p|
        Producto.where(sku: p["sku"], imagen_url: nil).update_all(imagen_url: p["imagen_url"], updated_at: Time.current)
      end
      puts "La base ya tiene datos: no se ejecuta el seed (imágenes asignadas: #{asignadas})"
    else
      Rails.application.load_seed
    end
  end
end
