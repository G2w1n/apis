namespace :tienda do
  desc "Carga los datos de ejemplo solo si la base está vacía (para ejecutarlo en cada arranque en la nube)"
  task seed_si_vacio: :environment do
    if Usuario.exists?
      puts "La base ya tiene datos: no se ejecuta el seed"
    else
      Rails.application.load_seed
    end
  end
end
