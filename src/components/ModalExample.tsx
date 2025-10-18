"use client";

import React, { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveButton,
} from "@/components/ResponsiveComponents";

export default function ModalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Modal Example</h1>

      <div className="space-x-4 mb-4">
        <ResponsiveButton onClick={() => setShowOverlay(true)}>
          Show with Overlay
        </ResponsiveButton>
        <ResponsiveButton onClick={() => setShowOverlay(false)}>
          Show without Overlay
        </ResponsiveButton>
      </div>

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        showOverlay={showOverlay}
      >
        <div className="py-4">
          <p className="mb-4">
            This is an example modal. Notice how it behaves differently based on
            whether the overlay is shown or not.
          </p>
          <p>
            When showOverlay is false, there's no dark background behind the
            modal, making it appear as a simple popup without dimming the rest
            of the page.
          </p>
        </div>
      </ResponsiveModal>

      <ResponsiveButton onClick={() => setIsModalOpen(true)}>
        Open Modal
      </ResponsiveButton>
    </div>
  );
}
