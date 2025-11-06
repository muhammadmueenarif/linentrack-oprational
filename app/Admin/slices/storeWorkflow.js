'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Switch } from '../ui/components/Switch';
import { Dropdown } from '../ui/components/Dropdown';
import { ErrorMessage, SuccessMessage } from '../../Common/Components/AlertNotification';
import { db } from '../../../config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const Section = ({ title, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: "600px" }}
        className="bg-white p-6 rounded-lg shadow mb-6"
    >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
    </motion.div>
);

const Field = ({ label, children }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700">{label}</span>
        {children}
    </div>
);

const InputField = ({ label, value, onChange, type = "text", disabled }) => (
    <Field label={label}>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-24 p-2 text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
        />
    </Field>
);

const SwitchField = ({ label, checked, onChange, disabled }) => {
    const handleToggle = () => {
        onChange(!checked);
    };

    return (
        <Field label={label}>
            <Switch
                checked={checked}
                onChange={handleToggle}
                labelPosition="right"
                disabled={disabled}
            />
        </Field>
    );
};

const DropdownField = ({ label, data, selected, onSelect, disabled }) => (
    <Field label={label}>
        <Dropdown
            data={data}
            selected={selected}
            onSelect={onSelect}
            className="w-48"
            disabled={disabled}
        />
    </Field>
);

const GeneralSettings = ({ workflow, handleChange, disabled }) => (
    <Section title="General Settings">
        <DropdownField
            label="Default Price List"
            data={['Default']}
            selected={workflow?.defaultPriceList}
            onSelect={(value) => handleChange('defaultPriceList', value)}
            disabled={disabled}
        />
        <DropdownField
            label="Rental Pre-Order Threshold"
            data={['24 hrs', '48 hrs', '72 hrs']}
            selected={workflow?.rentalPreOrderThreshold}
            onSelect={(value) => handleChange('rentalPreOrderThreshold', value)}
            disabled={disabled}
        />
        <InputField
            label="Store Closed Dates"
            value={workflow?.storeClosedDates}
            onChange={(value) => handleChange('storeClosedDates', value)}
            type="datetime-local"
            disabled={disabled}
        />
        <SwitchField
            label="Enable Retail Orders"
            checked={workflow?.enableRetailOrders}
            onChange={(value) => handleChange('enableRetailOrders', value)}
            disabled={disabled}
        />
        <InputField
            label="Minimum Order Amount($)"
            value={workflow?.minimumOrderAmount}
            onChange={(value) => handleChange('minimumOrderAmount', value)}
            type="number"
            disabled={disabled}
        />
        <InputField
            label="Maximum Prices per Order"
            value={workflow?.maximumPricesPerOrder}
            onChange={(value) => handleChange('maximumPricesPerOrder', value)}
            type="number"
            disabled={disabled}
        />
    </Section>
);

const NewOrderSettings = ({ workflow, handleChange, disabled }) => (
    <Section title="New Order">
        <DropdownField
            label="Weight Symbol"
            data={['KG', 'LB', 'OZ']}
            selected={workflow?.weightSymbol}
            onSelect={(value) => handleChange('weightSymbol', value)}
            disabled={disabled}
        />
        <SwitchField
            label="Show Promo Code Box"
            checked={workflow?.showPromoCodeBox}
            onChange={(value) => handleChange('showPromoCodeBox', value)}
            disabled={disabled}
        />
        <SwitchField
            label="Allow Staff to Modify Prices"
            checked={workflow?.allowStaffToModifyPrices}
            onChange={(value) => handleChange('allowStaffToModifyPrices', value)}
            disabled={disabled}
        />
        <SwitchField
            label="Show Damages Section"
            checked={workflow?.showDamagesSection}
            onChange={(value) => handleChange('showDamagesSection', value)}
            disabled={disabled}
        />
    </Section>
);

const CleaningSettings = ({ workflow, handleChange, disabled }) => (
    <Section title="Cleaning">
        <SwitchField
            label="Customer Contact Info"
            checked={workflow?.customerContactInfo}
            onChange={(value) => handleChange('customerContactInfo', value)}
            disabled={disabled}
        />
        <SwitchField
            label="Placed Date"
            checked={workflow?.placedDate}
            onChange={(value) => handleChange('placedDate', value)}
            disabled={disabled}
        />
        <SwitchField
            label="Laundry Bags"
            checked={workflow?.laundryBags}
            onChange={(value) => handleChange('laundryBags', value)}
            disabled={disabled}
        />
        <InputField
            label="Highlight Order Row Red if Late by"
            value={workflow?.highlightOrderRowRed}
            onChange={(value) => handleChange('highlightOrderRowRed', value)}
            type="number"
            disabled={disabled}
        />
    </Section>
);

const ReadySettings = ({ workflow, handleChange, disabled }) => (
    <Section title="Ready">
        <SwitchField
            label="Optional Columns"
            checked={workflow?.optionalColumns2}
            onChange={(value) => handleChange('optionalColumns2', value)}
            disabled={disabled}
        />
        <SwitchField
            label="Pickup Date"
            checked={workflow?.pickupDate}
            onChange={(value) => handleChange('pickupDate', value)}
            disabled={disabled}
        />
        <SwitchField
            label="Show Order Edit History"
            checked={workflow?.showOrderEditHistory}
            onChange={(value) => handleChange('showOrderEditHistory', value)}
            disabled={disabled}
        />
        <InputField
            label="Highlight Order Row Red if Late by"
            value={workflow?.highlightOrderRowRedBy}
            onChange={(value) => handleChange('highlightOrderRowRedBy', value)}
            type="number"
            disabled={disabled}
        />
    </Section>
);

const NotificationAlert = ({ alert, onClose }) => {
    React.useEffect(() => {
        if (alert) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [alert, onClose]);

    if (!alert) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {alert.type === 'success' ? (
                <SuccessMessage message={alert.message} />
            ) : (
                <ErrorMessage message={alert.message} />
            )}
        </div>
    );
};

function Workflow() {
    const { isSidebarOpen } = useSidebar();
    const [workflow, setWorkflow] = useState(null);
    const [initialWorkflow, setInitialWorkflow] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Extract adminId from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    const adminId = userData?.id;

    // Fetch workflow settings from Firestore
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                if (!adminId) {
                    throw new Error('No admin ID found');
                }
                const storeId = localStorage.getItem('selectedStoreId');
                if (!storeId) {
                    throw new Error('No store selected');
                }

                const storeSettingsRef = doc(db, 'storeSettings', storeId);
                const storeDoc = await getDoc(storeSettingsRef);

                if (storeDoc.exists()) {
                    const data = storeDoc.data();
                    const workflowData = data.workflow || {
                        defaultPriceList: 'Default',
                        rentalPreOrderThreshold: '24 hrs',
                        storeClosedDates: '',
                        enableRetailOrders: false,
                        minimumOrderAmount: '',
                        maximumPricesPerOrder: '',
                        weightSymbol: 'KG',
                        showPromoCodeBox: false,
                        allowStaffToModifyPrices: false,
                        showDamagesSection: false,
                        customerContactInfo: false,
                        placedDate: false,
                        laundryBags: false,
                        highlightOrderRowRed: '',
                        optionalColumns2: false,
                        pickupDate: false,
                        showOrderEditHistory: false,
                        highlightOrderRowRedBy: ''
                    };
                    setWorkflow(workflowData);
                    setInitialWorkflow(JSON.parse(JSON.stringify(workflowData))); // Deep copy for comparison
                }
            } catch (error) {
                setAlert({
                    type: 'error',
                    message: error.message || 'Failed to fetch settings'
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [adminId]);

    // Check for unsaved changes
    useEffect(() => {
        if (workflow && initialWorkflow) {
            const hasChanges = JSON.stringify(workflow) !== JSON.stringify(initialWorkflow);
            setHasUnsavedChanges(hasChanges);
        }
    }, [workflow, initialWorkflow]);

    const handleChange = (field, value) => {
        setWorkflow(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (!adminId) {
                throw new Error('No admin ID found');
            }
            const storeId = localStorage.getItem('selectedStoreId');
            if (!storeId) {
                throw new Error('No store selected');
            }

            const storeSettingsRef = doc(db, 'storeSettings', storeId);
            await updateDoc(storeSettingsRef, {
                workflow: workflow,
                lastUpdated: new Date().toISOString()
            });

            setInitialWorkflow(JSON.parse(JSON.stringify(workflow))); // Update initial state after save
            setHasUnsavedChanges(false);
            setAlert({
                type: 'success',
                message: 'Settings updated successfully!'
            });
        } catch (error) {
            setAlert({
                type: 'error',
                message: error.message || 'Failed to update settings'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-14'} relative`}>
                <main className="mt-20">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl text-gray-800 font-bold mb-6"
                    >
                        Workflow Settings
                    </motion.h1>

                    {hasUnsavedChanges && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6 flex items-center gap-2"
                        >
                            <svg
                                className="w-5 h-5 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <span>Your changes are not saved. Please save to apply them.</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <GeneralSettings workflow={workflow} handleChange={handleChange} disabled={isSubmitting} />
                        <NewOrderSettings workflow={workflow} handleChange={handleChange} disabled={isSubmitting} />
                        <CleaningSettings workflow={workflow} handleChange={handleChange} disabled={isSubmitting} />
                        <ReadySettings workflow={workflow} handleChange={handleChange} disabled={isSubmitting} />

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                                w-1/4 ml-20 bg-[#1D4FB6] text-white font-bold py-2 px-4 rounded mb-6 
                                transition-all duration-300 hover:bg-[#1a45a0]
                                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </span>
                            ) : (
                                'Save Changes'
                            )}
                        </motion.button>
                    </form>
                </main>
            </div>

            <NotificationAlert
                alert={alert}
                onClose={() => setAlert(null)}
            />
        </>
    );
}

export default function Page() {
    return (
        <SidebarProvider>
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 overflow-auto pb-10">
                    <Workflow />
                </div>
            </div>
        </SidebarProvider>
    );
}