import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

interface PopupMessageDialogProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PopupMessageDialog({ title = 'Not Available', message, onClose, isOpen }: PopupMessageDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      transition
      className="z-50 fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-200 ease-out data-[closed]:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-70" />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel className="bg-bgdark p-6 rounded-lg shadow-lg text-white w-80 max-w-full relative">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-primarytext font-semibold text-xl">{title}</DialogTitle>
            <button
              className="text-primarytext p-2 hover:bg-slightmuted rounded-full transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <XMarkIcon className="w-7 h-7" />
            </button>
          </div>
          <Description className="text-base text-mutedtext" dangerouslySetInnerHTML={{ __html: message }} />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default PopupMessageDialog;
