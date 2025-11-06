"use client";
import React from 'react';

const SaveOrPublishModal = ({ isOpen, onClose, onSave, onPublish }) => {
  if (!isOpen) return null;

  return (
    <>
      <div   className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div style={{maxWidth:"300px",display:"flex",flexDirection:"column",justifyContent:"center"}}  className="bg-white p-6 rounded-lg shadow-lg ">
          <h2 className="text-xl font-bold mb-4">Publish Policy?</h2>
          <p className="mb-4">Are you sure to publish this policy or want to save it instead?</p>
          <div className="flex justify-center">
            <button
              className="bg-[#908ee5] text-white px-4 py-2 rounded mr-2"
              onClick={onSave}
            >
              Save
            </button>
            <button
              className="bg-[#4640DE] text-white px-4 py-2 rounded"
              onClick={onPublish}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SaveOrPublishModal;
