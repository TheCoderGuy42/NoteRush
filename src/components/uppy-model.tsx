// Example structure for a simple Modal component (e.g., components/Modal.tsx)
"use client"; // If it has its own state or event handlers
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative w-full max-w-2xl rounded-lg bg-gray-800 p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};
export default Modal;
