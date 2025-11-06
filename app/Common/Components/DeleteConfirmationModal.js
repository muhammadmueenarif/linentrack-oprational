"use client";
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, intnet, IntentDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">{intnet}</h2>
        <p className="mb-4">{IntentDetails}</p>
        <div className="flex justify-end">
          <button
            className="bg-[#4640DE] text-white px-4 py-2 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => {
             
              onConfirm();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
