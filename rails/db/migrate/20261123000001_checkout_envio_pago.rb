class CheckoutEnvioPago < ActiveRecord::Migration[8.0]
  def up
    add_column :pedidos, :subtotal, :decimal, precision: 12, scale: 2, null: false, default: 0
    add_column :pedidos, :costo_envio, :decimal, precision: 8, scale: 2, null: false, default: 0
    add_column :pedidos, :envio, :jsonb # nombre, teléfono, dirección, distrito, zona, días
    add_column :pedidos, :pago, :jsonb  # método y últimos 4 dígitos (nunca el número completo)
    # Antes del checkout no había envío: el subtotal era el total
    execute "UPDATE pedidos SET subtotal = total"
  end

  def down
    remove_columns :pedidos, :subtotal, :costo_envio, :envio, :pago
  end
end
