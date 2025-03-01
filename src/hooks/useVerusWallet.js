import { ref, onMounted, watch } from 'vue';

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
                    await refreshBalances();

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
            if (!isConnected.value) return;
            error.value = null;
            balanceError.value = null;
            loading.value = true;

            console.log('[useVerusWallet] Refreshing all balances');
            const response = await window.verus.getAllBalances();
            console.log('[useVerusWallet] Raw balance response:', response);
            
            if (!response || !response.success || !response.balances || typeof response.balances !== 'object') {
                throw new Error('Invalid balance response format');
            }

            // Store balances directly as they come from background
            balances.value = response.balances;
            console.log('[useVerusWallet] Updated balances:', balances.value);

            // Update currency objects with their balances
            if (currencies.value.length > 0) {
                currencies.value = currencies.value.map(currency => {
                    // Try both currencyid and name for VRSCTEST compatibility
                    const currencyId = currency.currencyid || currency.name;
                    const balance = response.balances[currencyId] || '0.00000000';
                    
                    console.log(`[useVerusWallet] Updating currency ${currencyId} with balance:`, balance);
                    
                    return {
                        ...currency,
                        balance,
                        currencyid: currencyId,
                        name: currency.name || currencyId
                    };
                });
                console.log('[useVerusWallet] Updated currencies:', currencies.value);
            }
        } catch (err) {
            balanceError.value = err.message;
            console.error('[useVerusWallet] Error refreshing balances:', err);
        } finally {
            loading.value = false;
        }
    };

    // Auto-refresh balances periodically when connected
    let refreshInterval = null;
    watch(isConnected, async (newIsConnected) => {
        if (newIsConnected) {
            // Initial refresh
            await refreshBalances();
            // Start periodic refresh
            refreshInterval = setInterval(refreshBalances, 30000); // Refresh every 30 seconds
        } else {
            // Clear refresh interval when disconnected
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        }
    });

    // Clean up interval on unmount
    onMounted(() => {
        checkExtension();
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        };
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
