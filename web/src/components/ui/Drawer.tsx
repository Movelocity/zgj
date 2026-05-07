import React from 'react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './sheet';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '480px',
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn('w-[min(100vw,var(--drawer-width))] sm:max-w-none')}
        style={{ '--drawer-width': width } as React.CSSProperties}
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-xl">{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Drawer;
