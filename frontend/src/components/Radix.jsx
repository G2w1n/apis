// Envoltorios de Radix UI con el estilo de Voltec: foco con teclado, Esc, lector de pantalla y animación incluidos
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { X } from 'lucide-react';

export function Ayuda({ texto, children }) {
  return (
    <Tooltip.Root delayDuration={250}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} className="z-[80] rounded-lg border border-borde bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-xl animate-aparecer">
          {texto}<Tooltip.Arrow className="fill-slate-950" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export const ProveedorAyudas = Tooltip.Provider;

export function Ventana({ titulo, descripcion, abierto, alCerrar, children, ancho = 'max-w-lg' }) {
  return (
    <Dialog.Root open={abierto} onOpenChange={(v) => !v && alCerrar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-aparecer" />
        <Dialog.Content className={`fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] ${ancho} -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-borde bg-panel p-6 shadow-2xl data-[state=open]:animate-desvanecer`}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-xl font-bold">{titulo}</Dialog.Title>
              {descripcion
                ? <Dialog.Description className="mt-1 text-sm text-slate-400">{descripcion}</Dialog.Description>
                : <Dialog.Description className="sr-only">{titulo}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Cerrar"><X className="h-5 w-5" /></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MenuDesplegable({ disparador, children }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>{disparador}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={8} className="z-[80] min-w-52 rounded-xl border border-borde bg-panel p-1.5 shadow-2xl animate-aparecer">
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export const OpcionMenu = ({ children, peligro, ...props }) => (
  <Menu.Item {...props} className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/5 ${peligro ? 'text-red-300' : 'text-slate-200'}`}>
    {children}
  </Menu.Item>
);
export const SeparadorMenu = () => <Menu.Separator className="my-1 h-px bg-borde" />;
export const EtiquetaMenu = ({ children }) => <Menu.Label className="px-3 py-1.5 text-xs text-slate-500">{children}</Menu.Label>;
