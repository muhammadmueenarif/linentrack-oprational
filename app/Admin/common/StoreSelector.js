"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, ChevronDown, ChevronRight, Store, AlertCircle, MapPin } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Progress,
    FloatingInput
} from '../../ui/components';
import { db } from '../../config';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import useUserData from '../hooks/useUserData';

const LocationSearchInput = ({ onSelect }) => {
    const autoCompleteRef = useRef(null);
    const inputRef = useRef(null);
    const [addressInput, setAddressInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (window.google && window.google.maps) {
                initializeAutocomplete();
                return;
            }

            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                existingScript.addEventListener('load', initializeAutocomplete);
                return;
            }

            const script = document.createElement('script');
            script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAGnUBFhtnuRHwQ_dEDiTuo35HfIBY3HP8&libraries=places";
            script.async = true;
            script.defer = true;
            script.onload = initializeAutocomplete;
            document.head.appendChild(script);

            return () => {
                script.onload = null;
            };
        };

        loadGoogleMapsScript();

        return () => {
            if (autoCompleteRef.current && window.google) {
                window.google.maps.event.clearInstanceListeners(autoCompleteRef.current);
            }
        };
    }, []);

    const extractAddressComponent = (components, type) => {
        const component = components.find(comp => comp.types.includes(type));
        return component ? component.long_name : '';
    };

    const initializeAutocomplete = () => {
        if (!window.google || !window.google.maps) {
            console.error('Google Maps API not loaded');
            return;
        }

        autoCompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
                types: ['address'],
                componentRestrictions: { country: ['US', 'CA'] },
            }
        );

        autoCompleteRef.current.addListener('place_changed', async () => {
            setLoading(true);
            const place = autoCompleteRef.current.getPlace();

            if (!place || !place.geometry) {
                console.error('No geometry available for selected place');
                setLoading(false);
                return;
            }

            const addressComponents = place.address_components || [];
            const streetNumber = extractAddressComponent(addressComponents, 'street_number');
            const route = extractAddressComponent(addressComponents, 'route');
            const address = `${streetNumber} ${route}`.trim();

            const locationData = {
                formattedAddress: place.formatted_address || '',
                address: address || place.formatted_address || '',
                city: extractAddressComponent(addressComponents, 'locality'),
                state: extractAddressComponent(addressComponents, 'administrative_area_level_1'),
                country: extractAddressComponent(addressComponents, 'country'),
                postalCode: extractAddressComponent(addressComponents, 'postal_code'),
                coordinates: {
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng()
                }
            };

            try {
                const timestamp = Math.floor(Date.now() / 1000);
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/timezone/json?location=${locationData.coordinates.latitude},${locationData.coordinates.longitude}&timestamp=${timestamp}&key=AIzaSyAGnUBFhtnuRHwQ_dEDiTuo35HfIBY3HP8`
                );
                const timezoneData = await response.json();
                if (timezoneData.timeZoneId) {
                    locationData.timezone = timezoneData.timeZoneId;
                }
            } catch (error) {
                console.error('Error fetching timezone:', error);
                locationData.timezone = 'UTC';
            }

            setAddressInput(place.formatted_address || '');
            onSelect(locationData);
            setLoading(false);
        });
    };

    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <MapPin className="w-5 h-5" />
            </div>
            <input
                ref={inputRef}
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter store address"
                className="w-full pl-10 pr-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

const AddStoreModal = ({ onClose, onSubmit, currentStoreCount }) => {
    const { User_id } = useUserData();
    const dispatch = useDispatch();
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [formData, setFormData] = useState({
        storeName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phoneNumber: '',
        timezone: 'UTC',
        coordinates: {
            latitude: '',
            longitude: ''
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const subData = localStorage.getItem('subscriptionData');
        console.log('Raw localStorage subscriptionData:', subData);
        if (subData) {
            const parsedData = JSON.parse(subData);
            console.log('Parsed localStorage subscriptionData:', parsedData);
            setSubscriptionData(parsedData);
        }
    }, []);

    const handleInputChange = (id, value) => {
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleLocationSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            address: locationData.address,
            city: locationData.city,
            state: locationData.state,
            country: locationData.country,
            zipCode: locationData.postalCode,
            coordinates: {
                latitude: locationData.coordinates.latitude,
                longitude: locationData.coordinates.longitude
            },
            timezone: locationData.timezone || 'UTC'
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting store:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!subscriptionData) {
        return null;
    }

    console.log('=== COMPLETE SUBSCRIPTION DATA ===');
    console.log('Full subscriptionData object:', JSON.stringify(subscriptionData, null, 2));
    console.log('subscriptionData.features:', subscriptionData.features);
    console.log('subscriptionData.features type:', typeof subscriptionData.features);
    
    const maxStores = subscriptionData.allowNumberOfStores;
    const storeProgress = maxStores ? (currentStoreCount / maxStores) * 100 : 0;
    const canAddStore = maxStores ? currentStoreCount < maxStores : false;
    
    console.log('Store limit check:');
    console.log('- Current store count:', currentStoreCount);
    console.log('- Max stores allowed:', maxStores);
    console.log('- Can add store:', canAddStore);
    console.log('- Store progress:', storeProgress + '%');

    if (!canAddStore) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Store Limit Reached</DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-yellow-800 text-sm">
                                You have reached the maximum number of stores ({maxStores}) allowed in your {subscriptionData.selectedTier} plan.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Add New Store</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-2 text-blue-800 mb-2">
                            <Store className="w-5 h-5" />
                            <span className="font-semibold">Subscription Plan Details</span>
                        </div>
                        <div className="text-sm text-blue-700">
                            <p>Current Plan: {subscriptionData.selectedTier}</p>
                            <p>Billing Cycle: {subscriptionData.billingCycle}</p>
                            <p>Stores Created: {currentStoreCount} of {maxStores}</p>
                        </div>
                        <div className="mt-3">
                            <Progress value={storeProgress} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <FloatingInput
                            id="storeName"
                            label="Store Name"
                            value={formData.storeName}
                            onChange={handleInputChange}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Store Location</label>
                            <LocationSearchInput onSelect={handleLocationSelect} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput
                                id="phoneNumber"
                                label="Phone Number"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                            />
                            <FloatingInput
                                id="zipCode"
                                label="Zip Code"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput
                                id="city"
                                label="City"
                                value={formData.city}
                                onChange={handleInputChange}
                            />
                            <FloatingInput
                                id="state"
                                label="State"
                                value={formData.state}
                                onChange={handleInputChange}
                            />
                        </div>

                        <FloatingInput
                            id="country"
                            label="Country"
                            value={formData.country}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <div className="flex justify-end gap-3">
                        <Button variant="warning" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!formData.storeName || !formData.address || isSubmitting}
                            className="relative"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </span>
                            ) : (
                                'Add Store'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const StoreSelector = ({ onStoreSelect }) => {
    const dispatch = useDispatch();
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(() =>
        localStorage.getItem('selectedStore') || ''
    );
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [showAddStore, setShowAddStore] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const { User_id: adminId } = useUserData();

    const fetchStores = async () => {
        if (!adminId) return;

        try {
            const storesRef = collection(db, 'stores');
            const querySnapshot = await getDocs(storesRef);
            const storesData = querySnapshot.docs
                .filter(doc => doc.data().adminId === adminId)
                .map(doc => ({ id: doc.id, ...doc.data() }));

            setStores(storesData);
            localStorage.setItem('stores', JSON.stringify(storesData));

            const currentStoreId = localStorage.getItem('selectedStoreId');
            if (storesData.length > 0 && !currentStoreId) {
                const defaultStore = storesData[0];
                handleSelectStore(defaultStore, false);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            setStatusMessage({
                type: 'error',
                message: 'Failed to fetch stores'
            });
        }
    };

    useEffect(() => {
        const storedStores = JSON.parse(localStorage.getItem('stores') || '[]');
        if (storedStores.length > 0) {
            setStores(storedStores);
        } else {
            fetchStores();
        }
    }, []);

    const handleSelectStore = useCallback((store, shouldReload = true) => {
        setSelectedStore(store.storeName);
        localStorage.setItem('selectedStore', store.storeName);
        localStorage.setItem('selectedStoreId', store.id);
        setShowStoreModal(false);

        if (onStoreSelect) {
            onStoreSelect(store);
        }

        if (shouldReload) {
            window.location.reload();
        }
    }, [onStoreSelect]);

    const handleAddStore = async (storeData) => {
        if (!adminId) return;

        try {
            const basicStoreData = {
                adminId,
                storeName: storeData.storeName || '',
                address: storeData.address || '',
                city: storeData.city || '',
                country: storeData.country || '',
                zipCode: storeData.zipCode || '',
                phoneNumber: storeData.phoneNumber || '',
                coordinates: {
                    latitude: storeData.coordinates.latitude || '',
                    longitude: storeData.coordinates.longitude || ''
                },
                createdAt: new Date().toISOString()
            };

            const storeRef = collection(db, 'stores');
            const docRef = await addDoc(storeRef, basicStoreData);
            const newStore = { id: docRef.id, ...basicStoreData };

            const settingsRef = doc(db, 'storeSettings', docRef.id);
            await setDoc(settingsRef, {
                id: docRef.id,
                name: storeData.storeName || '',
                address: storeData.address || '',
                city: storeData.city || '',
                country: storeData.country || '',
                zipCode: storeData.zipCode || '',
                phoneNumber: storeData.phoneNumber || '',
                companyName: storeData.storeName || '',
                streetAddress: storeData.address || '',
                settings: {
                    companyName: storeData.storeName || '',
                    streetAddress: storeData.address || '',
                    zipCode: storeData.zipCode || '',
                    city: storeData.city || '',
                    telephone: storeData.phoneNumber || '',
                },
                timezone: storeData.timezone || 'UTC',
                language: 'English',
                gpsCoordinates: {
                    latitude: storeData.coordinates.latitude || '',
                    longitude: storeData.coordinates.longitude || ''
                },
                servicesOffered: {
                    pickupDelivery: false,
                    lockers: false,
                    inStoreOrders: false,
                    carOrders: false,
                    logo: {
                        url: '',
                        showOnEmail: false,
                        showOnNav: false,
                        showOnInvoice: false
                    }
                },
                tax: {
                    salesTaxType: '',
                    tax1: { name: '', rate: '' },
                    tax2: { name: '', rate: '' },
                    tax3: { name: '', rate: '' },
                    taxVatNumber: '',
                    customIdForReports: ''
                },
                security: {
                    ipRestrictions: { enabled: false, addresses: [] },
                    pinSettings: { inactivityTimeout: 0, required: false },
                    clockInSettings: {
                        requireAdminClockIn: false,
                    },
                    twoFactorAuth: { enabled: false, requiredForAdmin: false },
                    orderEditRestrictions: {
                        enabled: false,
                        dateRange: { start: null, end: null }
                    }
                },
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });

            setStores(prev => [...prev, newStore]);
            localStorage.setItem('stores', JSON.stringify([...stores, newStore]));
            setShowAddStore(false);
            setStatusMessage({
                type: 'success',
                message: 'Store added successfully'
            });
            handleSelectStore(newStore);
        } catch (error) {
            console.error('Error adding store:', error);
            setStatusMessage({
                type: 'error',
                message: 'Failed to add store'
            });
            throw error;
        }
    };

    const handleRefreshStores = () => {
        fetchStores();
    };

    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    return (
        <div className="relative mb-4">
            {statusMessage && (
                <div className={`flex items-start gap-3 p-4 mb-4 rounded-lg border ${statusMessage.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 ${statusMessage.type === 'success'
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`} />
                    <p className={
                        statusMessage.type === 'success'
                            ? 'text-green-800 text-sm'
                            : 'text-red-800 text-sm'
                    }>
                        {statusMessage.message}
                    </p>
                </div>
            )}

            <Button
                onClick={() => setShowStoreModal(true)}
                className="flex items-center justify-between mt-4 w-full px-6 py-3 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
                <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 font-medium">
                        {selectedStore || 'Select Store'}
                    </span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
            </Button>

            {showStoreModal && (
                <Dialog open={true} onOpenChange={setShowStoreModal}>
                    <DialogContent className="min-h-[200px] sm:max-w-[500px] overflow-hidden rounded-xl">
                        <DialogHeader className="pb-4 border-b mt-5">
                            <div className="w-full flex justify-between items-center px-2">
                                <div className="flex items-center gap-2">
                                    <Store className="w-6 h-6 text-blue-600" />
                                    <DialogTitle className="text-xl font-semibold text-gray-800">
                                        Your Stores
                                    </DialogTitle>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            setShowAddStore(true);
                                            setShowStoreModal(false);
                                        }}
                                        className="flex ml-7 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span className="font-medium">New Store</span>
                                    </Button>
                                    <Button
                                        onClick={handleRefreshStores}
                                        title="get Latest Stores"
                                        className="flex items-center gap-2 bg-green-400 hover:bg-green-600 text-gray-700 rounded-lg px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <span className="font-medium">Refresh</span>
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="mt-4 max-h-[400px] overflow-y-auto px-2">
                            <div className="grid gap-3 m-2">
                                {stores.map((store) => (
                                    <Button
                                        key={store.id}
                                        onClick={() => handleSelectStore(store)}
                                        variant="ghost"
                                        className="w-full h-[80px] group relative flex items-start gap-4 p-4
                                            bg-white hover:bg-blue-50 border border-gray-200 
                                            text-gray-700 hover:text-blue-700 
                                            rounded-xl transition-all duration-200
                                            hover:border-blue-300 hover:shadow-md
                                            justify-start text-left"
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Store className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex flex-col flex-grow">
                                            <span className="font-semibold text-lg group-hover:text-blue-700">
                                                {store.storeName}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-500">
                                                    {store.address}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 border-t mt-4">
                            <div className="text-sm text-gray-500 text-center">
                                {stores.length === 0 ? (
                                    "No stores found. Create your first store!"
                                ) : (
                                    "Select a store to manage or create a new one"
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {showAddStore && (
                <AddStoreModal
                    onClose={() => {
                        setShowAddStore(false);
                        setShowStoreModal(true);
                    }}
                    onSubmit={handleAddStore}
                    currentStoreCount={stores.length}
                />
            )}
        </div>
    );
};

export default StoreSelector;