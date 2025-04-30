"use client";

import { Drawer } from "vaul";

export default function VaulDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>Open Drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 h-fit bg-gray-100 outline-none">
          <div className="bg-white p-4">{/* Content */}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
