import { ref, onMounted } from 'vue';

// Track pending currency request
let currencyRequestPromise = null;

/**
 * Hook for interacting with the Verus wallet extension
 * @returns {Object} Hook methods and state
 */
export function useVerusWallet() {
    const address = ref(null);
    const balances = ref({});
    const isConnected = ref(false);
    const isInstalled = ref(false);
    const error = ref(null);
    const currencies = ref([]);
    const network = ref({ isTestnet: true });
    const loading = ref(false);
    const balanceError = ref(null);

    // Initialize state
    const checkExtension = async () => {
        try {
            isInstalled.value = typeof window.verus !== 'undefined';
            if (isInstalled.value) {
                isConnected.value = window.verus.isConnected;
                if (isConnected.value) {
                    address.value = window.verus.address;
                    await getCurrencies();
                }
            }
            console.log('[useVerusWallet] Extension check complete:', { 
                isInstalled: isInstalled.value, 
                isConnected: isConnected.value 
            });
        } catch (err) {
            console.error('[useVerusWallet] Error checking extension:', err);
            error.value = err.message;
        }
    };

    // Connect wallet
    const connect = async () => {
        try {
            loading.value = true;
            error.value = null;
            balanceError.value = null;

            if (!window.verus) {
                throw new Error('Verus provider not available');
            }

            await window.verus.connect();
            isConnected.value = true;
            address.value = window.verus.address;
            await getCurrencies();
            console.log('[useVerusWallet] Successfully connected wallet');
        } catch (err) {
            error.value = err.message;
            console.error('[useVerusWallet] Error connecting wallet:', err);
            isConnected.value = false;
            address.value = null;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Disconnect wallet
    const disconnect = async () => {
        try {
            loading.value = true;
            error.value = null;
            balanceError.value = null;
            isConnected.value = false;
            address.value = null;
            currencies.value = [];
            balances.value = {};
        } catch (err) {
            error.value = err.message;
            console.error('[useVerusWallet] Error disconnecting wallet:', err);
        } finally {
            loading.value = false;
        }
    };

    const getCurrencies = async () => {
        try {
            // If there's already a request in progress, return that promise
            if (currencyRequestPromise) {
                console.log('[useVerusWallet] Using existing currency request');
                return currencyRequestPromise;
            }

            error.value = null;
            balanceError.value = null;
            loading.value = true;
            
            // Create new request promise
            currencyRequestPromise = (async () => {
                try {
                    // Check if window.verus is available
                    if (!window.verus) {
                        throw new Error('Verus provider not available');
                    }

                    // Get currencies list
                    const currencyList = await window.verus.getCurrencies();
                    console.log('[useVerusWallet] Got currency list:', currencyList);
                    
                    if (!Array.isArray(currencyList)) {
                        console.error('[useVerusWallet] Invalid currency response:', currencyList);
                        throw new Error('Invalid currency data received');
                    }

                    // Update currencies list with zero balances initially
                    currencies.value = currencyList.map(currency => ({
                        ...currency,
                        balance: '0'
                    }));

                    // Fetch all balances in one call
                    try {
                        const newBalances = await window.verus.getAllBalances();
                        console.log('[useVerusWallet] Got all balances:', newBalances);
                        
                        if (newBalances && typeof newBalances === 'object') {
                            // Update balances state
                            balances.value = newBalances;

                            // Update currency objects with their balances
                            currencies.value = currencyList.map(currency => ({
                                ...currency,
                                balance: newBalances[currency.currencyid] || '0'
                            }));
                        } else {
                            console.error('[useVerusWallet] Invalid balance response:', newBalances);
                            throw new Error('Invalid balance data received');
                        }
                    } catch (err) {
                        console.error('[useVerusWallet] Error fetching balances:', err);
                        balanceError.value = err.message;
                    }

                    return currencyList;
                } finally {
                    loading.value = false;
                    // Clear the promise reference after a short delay
                    setTimeout(() => {
                        currencyRequestPromise = null;
                    }, 1000); // 1 second cooldown before allowing new requests
                }
            })();

            return currencyRequestPromise;
        } catch (err) {
            loading.value = false;
            error.value = err.message;
            console.error('[useVerusWallet] Error getting currencies:', err);
            throw err;
        }
    };

    const getBalance = async (currency) => {
        try {
            if (!isConnected.value) return '0';
            error.value = null;
            balanceError.value = null;
            loading.value = true;

            console.log('[useVerusWallet] Getting balance for currency:', currency);
            const balance = await window.verus.getBalance(currency);
            
            // Validate balance response
            if (typeof balance !== 'string' && typeof balance !== 'number') {
                throw new Error('Invalid balance format received');
            }
            
            const balanceStr = balance.toString();
            
            // Update balances state
            balances.value = {
                ...balances.value,
                [currency]: balanceStr
            };
            
            // Update currency object's balance
            const currencyToUpdate = currencies.value.find(c => c.currencyid === currency);
            if (currencyToUpdate) {
                currencyToUpdate.balance = balanceStr;
            }
            
            return balanceStr;
        } catch (err) {
            balanceError.value = err.message;
            console.error('[useVerusWallet] Error getting balance:', err);
            return '0';
        } finally {
            loading.value = false;
        }
    };

    const refreshBalances = async () => {
        try {
            if (!isConnected.value || currencies.value.length === 0) return;
            error.value = null;
            balanceError.value = null;
            loading.value = true;

            console.log('[useVerusWallet] Refreshing all balances');
            const newBalances = await window.verus.getAllBalances();
            
            if (!newBalances || typeof newBalances !== 'object') {
                throw new Error('Invalid balance response format');
            }
            
            // Update balances state
            balances.value = newBalances;

            // Update currency objects with their balances
            currencies.value = currencies.value.map(currency => ({
                ...currency,
                balance: newBalances[currency.currencyid] || '0'
            }));

            console.log('[useVerusWallet] Successfully updated balances:', newBalances);
        } catch (err) {
            balanceError.value = err.message;
            console.error('[useVerusWallet] Error refreshing balances:', err);
        } finally {
            loading.value = false;
        }
    };

    // Initialize on mount
    onMounted(() => {
        checkExtension();
    });

    return {
        // State
        address,
        balances,
        currencies,
        error,
        balanceError,
        isConnected,
        isInstalled,
        loading,
        network,
        
        // Methods
        checkExtension,
        connect,
        disconnect,
        getCurrencies,
        getBalance,
        refreshBalances
    };
}
